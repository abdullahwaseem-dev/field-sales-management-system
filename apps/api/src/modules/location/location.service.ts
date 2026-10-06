import { Inject, Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { sql } from 'kysely';
import pg from 'pg';
import { Subject } from 'rxjs';
import type { Principal } from '../../common/auth/principal';
import { distanceM } from '../../common/geo';
import { assertCanSee, canSee } from '../../common/scope';
import { SettingsService } from '../../common/services';
import { CONFIG, type Config } from '../../config';
import { type Db, declareCause, KYSELY, pgOptions } from '../../db/database';
import { insideGeofence, nearestGeofence } from '../attendance/context';
import { NotificationService } from '../notifications/notifications';
import { LIVE_CHANNEL, publishLive, upsertLive } from './live';

export interface PingInput {
  pingId: string;
  recordedAt: Date;
  lat: number;
  lng: number;
  accuracyM?: number;
  speedMps?: number;
  headingDeg?: number;
  provider?: 'gps' | 'network' | 'fused';
  isMock?: boolean;
}

const SKEW_MS = 2 * 60_000;

@Injectable()
export class LocationService implements OnModuleDestroy {
  private readonly log = new Logger('Location');
  /** Employee IDs whose live position changed (from Postgres NOTIFY, across all API instances). */
  readonly changes = new Subject<string>();
  private listener?: pg.Client;

  constructor(
    @Inject(KYSELY) private readonly db: Db,
    @Inject(CONFIG) private readonly config: Config,
    private readonly settings: SettingsService,
    private readonly notifications: NotificationService,
  ) {}

  /** Lazily opens one LISTEN connection per process for the live map. */
  async ensureListening() {
    if (this.listener) return;
    const client = new pg.Client({ ...pgOptions(this.config.DATABASE_URL_SESSION ?? this.config.DATABASE_URL, this.config.DATABASE_CA_CERT), application_name: 'sfms-live' });
    this.listener = client;
    client.on('notification', (m) => m.payload && this.changes.next(m.payload));
    client.on('error', (e) => {
      this.log.error(`live listener: ${e.message}`);
      this.listener = undefined;
    });
    await client.connect();
    await client.query(`LISTEN ${LIVE_CHANNEL}`);
  }

  async onModuleDestroy() {
    await this.listener?.end().catch(() => undefined);
  }

  /**
   * FR-LOC-01/04: batch upload from the device's offline queue. Idempotent per pingId. Pings outside a
   * checked-in shift are rejected individually (FR-LOC-03) rather than failing the whole batch.
   */
  async ingest(user: Principal, pings: PingInput[]) {
    const sorted = [...pings].sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
    const from = new Date(sorted[0]!.recordedAt.getTime() - SKEW_MS);
    const to = new Date(sorted.at(-1)!.recordedAt.getTime() + SKEW_MS);
    const events = await this.db
      .selectFrom('attendance_event as ev')
      .innerJoin('attendance_config as c', 'c.config_id', 'ev.config_id')
      .select(['ev.event_id', 'ev.work_date', 'ev.status', 'ev.check_in_at', 'ev.check_out_at', 'c.shift_timeout_hours'])
      .where('ev.employee_id', '=', user.employeeId)
      .where('ev.check_in_at', 'is not', null)
      .where('ev.check_in_at', '<=', to)
      .where((eb) => eb.or([eb('ev.check_out_at', 'is', null), eb('ev.check_out_at', '>=', from)]))
      .execute();
    const eventFor = (t: Date) =>
      events.find((e) => {
        const end = e.check_out_at ?? new Date(e.check_in_at!.getTime() + e.shift_timeout_hours * 3_600_000);
        return t.getTime() >= e.check_in_at!.getTime() - SKEW_MS && t.getTime() <= end.getTime() + SKEW_MS;
      });

    const accepted: { ping: PingInput; eventId: string }[] = [];
    const rejected: { pingId: string; reason: string }[] = [];
    for (const p of sorted) {
      const e = eventFor(p.recordedAt);
      if (e) accepted.push({ ping: p, eventId: e.event_id });
      else rejected.push({ pingId: p.pingId, reason: 'OUTSIDE_SHIFT' });
    }
    if (!accepted.length) return { accepted: 0, rejected };

    const maxKmh = await this.settings.get<number>('fraud.max_speed_kmh', 160);
    const byEvent = new Map<string, PingInput[]>();
    for (const a of accepted) byEvent.set(a.eventId, [...(byEvent.get(a.eventId) ?? []), a.ping]);

    await this.db.transaction().execute(async (trx) => {
      await trx
        .insertInto('location_ping')
        .values(accepted.map(({ ping: p, eventId }) => ({
          ping_id: p.pingId, employee_id: user.employeeId, attendance_event_id: eventId, recorded_at: p.recordedAt,
          lat: p.lat, lng: p.lng, accuracy_m: p.accuracyM ?? null, speed_mps: p.speedMps ?? null,
          heading_deg: p.headingDeg ?? null, provider: p.provider ?? null, is_mock: !!p.isMock,
        })))
        .onConflict((oc) => oc.columns(['ping_id', 'recorded_at']).doNothing())
        .execute();

      for (const [eventId, list] of byEvent) {
        const event = events.find((e) => e.event_id === eventId)!;
        // Impossible speed / mock location between consecutive pings (FR-FRAUD-01).
        const prev = await trx
          .selectFrom('location_ping')
          .select(['recorded_at', 'lat', 'lng', 'accuracy_m'])
          .where('attendance_event_id', '=', eventId)
          .where('recorded_at', '<', list[0]!.recordedAt)
          .orderBy('recorded_at', 'desc')
          .executeTakeFirst();
        const chain = [...(prev ? [{ recordedAt: prev.recorded_at, lat: prev.lat, lng: prev.lng, accuracyM: prev.accuracy_m ?? undefined }] : []), ...list];
        const signals: { type: 'mock_location' | 'impossible_speed'; evidence: Record<string, unknown> }[] = [];
        const mock = list.find((p) => p.isMock);
        if (mock) signals.push({ type: 'mock_location', evidence: { pingId: mock.pingId, recordedAt: mock.recordedAt } });
        for (let i = 1; i < chain.length; i++) {
          const a = chain[i - 1]!, b = chain[i]!;
          const dt = (b.recordedAt.getTime() - a.recordedAt.getTime()) / 1000;
          if (dt < 30 || (a.accuracyM ?? 0) > 100 || (b.accuracyM ?? 0) > 100) continue;
          const d = distanceM(a, b);
          const kmh = (d / dt) * 3.6;
          if (kmh > maxKmh) {
            signals.push({ type: 'impossible_speed', evidence: { distanceM: Math.round(d), seconds: Math.round(dt), kmh: Math.round(kmh), maxKmh } });
            break;
          }
        }
        if (signals.length) {
          const rows = await trx
            .insertInto('fraud_signal')
            .values(signals.map((s) => ({ event_id: eventId, phase: 'tracking' as const, type: s.type, evidence: JSON.stringify(s.evidence) })))
            .returning('signal_id')
            .execute();
          if (event.status === 'present' || event.status === 'late') {
            await declareCause(trx, { cause: 'fraud_flagged', fraudSignalId: rows[0]!.signal_id });
            await trx.updateTable('attendance_event').set({ status: 'suspected_fake' }).where('event_id', '=', eventId).execute();
            event.status = 'suspected_fake';
            const admin = await this.notifications.administrator(trx);
            if (admin) {
              await this.notifications.notify({ recipientId: admin, type: 'fraud_flagged', messageKey: 'notify.fraudFlagged', params: { employeeId: user.employeeId }, data: { eventId, signals: signals.map((s) => s.type) } }, trx);
            }
          }
        }

        if (!event.check_out_at) {
          const last = list.at(-1)!;
          await upsertLive(trx, user.employeeId, eventId, { ping_id: last.pingId, recorded_at: last.recordedAt, lat: last.lat, lng: last.lng, accuracy_m: last.accuracyM ?? null });
          await this.maybeNotifyGeofenceExit(trx, user.employeeId, eventId, event.work_date, last);
        }
      }
      await publishLive(trx, user.employeeId);
    });
    return { accepted: accepted.length, rejected };
  }

  /** FR-NOT-01 "geofence exit while on duty": once per shift, on the first fix outside the work area. */
  private async maybeNotifyGeofenceExit(trx: Db, employeeId: string, eventId: string, workDate: string, p: PingInput) {
    const geo = await nearestGeofence(trx, employeeId, workDate, p.lat, p.lng);
    if (!geo || insideGeofence(geo.distanceM, p.accuracyM)) return;
    const already = await trx
      .selectFrom('notification')
      .select('notification_id')
      .where('recipient_id', '=', employeeId)
      .where('type', '=', 'geofence_exit')
      .where(sql<boolean>`data->>'eventId' = ${eventId}`)
      .executeTakeFirst();
    if (already) return;
    await this.notifications.notify({ recipientId: employeeId, type: 'geofence_exit', messageKey: 'notify.geofenceExit', params: { site: geo.nameEn }, data: { eventId, distanceM: Math.round(geo.distanceM) } }, trx);
  }

  /** FR-DSH-01: current position of every on-duty rep the viewer may see. */
  async live(user: Principal, employeeId?: string) {
    let q = this.db
      .selectFrom('employee_live_location as l')
      .innerJoin('employee as e', 'e.employee_id', 'l.employee_id')
      .innerJoin('attendance_event as ev', 'ev.event_id', 'l.attendance_event_id')
      .leftJoin('team as t', 't.team_id', 'e.team_id')
      .select([
        'l.employee_id', 'e.full_name_en', 'e.full_name_ar', 'e.team_id', 't.name_en as team_en', 't.name_ar as team_ar', 'e.branch_id',
        'l.lat', 'l.lng', 'l.accuracy_m', 'l.recorded_at', 'ev.event_id', 'ev.status', 'ev.check_in_at', 'ev.is_late',
      ])
      .where(canSee(user));
    if (employeeId) q = q.where('l.employee_id', '=', employeeId);
    return q.orderBy('e.full_name_en').execute();
  }

  /** FR-ATM-03: one day's trail with timestamps. */
  async trail(user: Principal, employeeId: string, date: string) {
    await assertCanSee(this.db, user, employeeId);
    const event = await this.db.selectFrom('attendance_event').select(['event_id', 'check_in_at', 'check_out_at', 'status']).where('employee_id', '=', employeeId).where('work_date', '=', date).executeTakeFirst();
    if (!event) return { date, event: null, points: [] };
    const points = await this.db
      .selectFrom('location_ping')
      .select(['ping_id', 'recorded_at', 'lat', 'lng', 'accuracy_m', 'speed_mps', 'is_mock'])
      .where('attendance_event_id', '=', event.event_id)
      .orderBy('recorded_at')
      .execute();
    return { date, event, points };
  }
}
