import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { type Selectable, sql } from 'kysely';
import type { Principal } from '../../common/auth/principal';
import { conflict, forbidden, notFound, unprocessable } from '../../common/errors';
import { distanceM } from '../../common/geo';
import { canSee, assertCanSee } from '../../common/scope';
import { AuditService, SettingsService } from '../../common/services';
import { type Db, declareCause, KYSELY, type Tx } from '../../db/database';
import type { AttendanceEvent, FraudSignalType } from '../../db/schema';
import { ConsentService } from '../consent/consent';
import { publishLive, upsertLive } from '../location/live';
import { NotificationService } from '../notifications/notifications';
import { dayContext, insideGeofence, nearestGeofence } from './context';

export interface Fix {
  lat: number;
  lng: number;
  accuracyM?: number;
  provider?: 'gps' | 'network' | 'fused';
  isMock?: boolean;
}
export interface CheckInInput {
  location: Fix;
  /** Network (cell/Wi-Fi) position reported alongside GPS — compared for spoofing (FR-ATT-05). */
  networkLocation?: { lat: number; lng: number; accuracyM?: number };
  integrity?: { rooted?: boolean; emulator?: boolean; developerMockSetting?: boolean };
}
export interface CheckOutInput {
  location?: Fix;
  /** Must be true to check out before the required hours (8-hour rule): the app confirms first. */
  confirmShort?: boolean;
}

type EventRow = Selectable<AttendanceEvent>;

export function eventDto(e: EventRow) {
  return {
    eventId: e.event_id,
    workDate: e.work_date,
    status: e.status,
    checkInAt: e.check_in_at,
    checkOutAt: e.check_out_at,
    checkOutSource: e.check_out_source,
    isLate: e.is_late,
    lateMinutes: e.late_minutes,
    requiredWorkMinutes: e.required_work_minutes,
    workedMinutes: e.worked_minutes,
    shortfallMinutes: e.shortfall_minutes,
    isShortHours: e.is_short_hours,
    insideGeofence: e.check_in_inside_geofence,
    distanceM: e.check_in_distance_m,
    reviewNotes: e.review_notes,
    reviewedBy: e.reviewed_by,
    reviewedAt: e.reviewed_at,
  };
}

/** Spoofing indicators at check-in (FR-ATT-05, FR-FRAUD-01). Never rejects: flags for human review. */
export function checkInSignals(
  input: CheckInInput,
  geo: { inside: boolean | null; distanceM: number | null; action: 'block' | 'flag' },
  mismatchThresholdM: number,
): { type: FraudSignalType; evidence: Record<string, unknown> }[] {
  const out: { type: FraudSignalType; evidence: Record<string, unknown> }[] = [];
  const { location, networkLocation, integrity } = input;
  if (location.isMock || integrity?.developerMockSetting) {
    out.push({ type: 'mock_location', evidence: { isMock: !!location.isMock, developerMockSetting: !!integrity?.developerMockSetting, provider: location.provider } });
  }
  if (integrity?.rooted || integrity?.emulator) {
    out.push({ type: 'rooted_device', evidence: { rooted: !!integrity.rooted, emulator: !!integrity.emulator } });
  }
  if (networkLocation) {
    const d = distanceM(location, networkLocation);
    const allowance = mismatchThresholdM + (networkLocation.accuracyM ?? 0);
    if (d > allowance) {
      out.push({ type: 'gps_network_mismatch', evidence: { distanceM: Math.round(d), gps: location, network: networkLocation, thresholdM: mismatchThresholdM } });
    }
  }
  if (geo.inside === false && geo.action === 'flag') {
    out.push({ type: 'outside_geofence', evidence: { distanceM: Math.round(geo.distanceM ?? 0), accuracyM: location.accuracyM } });
  }
  return out;
}

@Injectable()
export class AttendanceService {
  private readonly log = new Logger('Attendance');

  constructor(
    @Inject(KYSELY) private readonly db: Db,
    private readonly settings: SettingsService,
    private readonly notifications: NotificationService,
    private readonly audit: AuditService,
    private readonly consent: ConsentService,
  ) {}

  // ── Rep: today ─────────────────────────────────────────────────────────────────────────────

  async today(user: Principal, now: Date) {
    const ctx = await dayContext(this.db, user.employeeId, now);
    const open = await this.openEvent(this.db, user.employeeId);
    const todays = open ?? (await this.db.selectFrom('attendance_event').selectAll().where('employee_id', '=', user.employeeId).where('work_date', '=', ctx.workDate).executeTakeFirst());
    const leave = await this.approvedLeaveOn(this.db, user.employeeId, ctx.workDate);
    const sites = await sql<{ geofenceId: string; nameEn: string; nameAr: string }>`
      SELECT g.geofence_id AS "geofenceId", g.name_en AS "nameEn", g.name_ar AS "nameAr"
      FROM employee_geofences(${user.employeeId}, ${ctx.workDate}::date) AS eg(geofence_id)
      JOIN geofence g ON g.geofence_id = eg.geofence_id ORDER BY g.name_en`.execute(this.db);

    const state = open
      ? 'on_duty'
      : todays?.check_out_at
        ? 'checked_out'
        : leave || todays?.status === 'on_leave'
          ? 'on_leave'
          : 'not_checked_in';

    return {
      serverTime: now,
      date: ctx.workDate,
      timezone: ctx.timezone,
      utcOffsetMinutes: ctx.utcOffsetMinutes,
      state,
      event: todays ? eventDto(todays) : null,
      rules: {
        windowStartAt: ctx.windowStartAt,
        latestStartAt: ctx.latestStartAt,
        graceMinutes: ctx.graceMinutes,
        requiredWorkMinutes: ctx.requiredWorkMinutes,
        pingIntervalSeconds: ctx.pingIntervalSeconds,
        shiftTimeoutHours: ctx.shiftTimeoutHours,
        photoRequired: ctx.photoRequired,
      },
      isOffDay: ctx.isOffDay,
      holiday: ctx.holidayEn ? { nameEn: ctx.holidayEn, nameAr: ctx.holidayAr } : null,
      leave: leave ? { requestId: leave.request_id, startDate: leave.start_date, endDate: leave.end_date, type: leave.type } : null,
      consent: await this.consent.status(user.employeeId),
      sites: sites.rows,
    };
  }

  // ── Rep: check in / check out ──────────────────────────────────────────────────────────────

  async checkIn(user: Principal, input: CheckInInput, now: Date) {
    if (user.client !== 'mobile' || !user.deviceId) throw forbidden('MOBILE_ONLY', 'Check in from the ZONA Sales app');
    await this.consent.assertAccepted(user.employeeId);
    const ctx = await dayContext(this.db, user.employeeId, now);

    if (await this.openEvent(this.db, user.employeeId)) throw conflict('ALREADY_CHECKED_IN', 'You are already checked in');
    const existing = await this.db.selectFrom('attendance_event').selectAll().where('employee_id', '=', user.employeeId).where('work_date', '=', ctx.workDate).executeTakeFirst();
    if (existing?.check_in_at) throw conflict('ALREADY_CHECKED_IN', 'You have already checked in today');
    if (existing?.status === 'on_leave' || (await this.approvedLeaveOn(this.db, user.employeeId, ctx.workDate))) {
      throw conflict('ON_LEAVE', 'You are on approved leave today');
    }

    const loc = input.location;
    const geo = await nearestGeofence(this.db, user.employeeId, ctx.workDate, loc.lat, loc.lng);
    const inside = geo ? insideGeofence(geo.distanceM, loc.accuracyM) : null;
    if (!geo) this.log.warn(`${user.employeeId} has no geofence assigned on ${ctx.workDate}; check-in not location-validated`);
    if (geo && !inside && ctx.outsideGeofenceAction === 'block') {
      throw unprocessable('OUTSIDE_GEOFENCE', 'You are outside your work area', {
        distanceM: Math.round(geo.distanceM), site: { nameEn: geo.nameEn, nameAr: geo.nameAr },
      });
    }

    // 8-hour rule: on time anywhere in the sign-in window; Late after latest start + grace.
    const lateBoundary = ctx.latestStartAt.getTime() + ctx.graceMinutes * 60_000;
    const isLate = now.getTime() > lateBoundary;
    const lateMinutes = isLate ? Math.ceil((now.getTime() - ctx.latestStartAt.getTime()) / 60_000) : 0;
    const mismatchM = await this.settings.get<number>('fraud.gps_network_mismatch_m', 1000);
    const signals = checkInSignals(input, { inside, distanceM: geo?.distanceM ?? null, action: ctx.outsideGeofenceAction }, mismatchM);

    await this.db.transaction().execute(async (trx) => {
      await declareCause(trx, { cause: 'check_in', actorId: user.employeeId });
      const fields = {
        check_in_at: now,
        check_in_lat: loc.lat,
        check_in_lng: loc.lng,
        check_in_accuracy_m: loc.accuracyM ?? null,
        check_in_device_id: user.deviceId,
        check_in_geofence_id: geo?.geofenceId ?? null,
        check_in_inside_geofence: inside,
        check_in_distance_m: geo ? Math.round(geo.distanceM) : null,
        is_late: isLate,
        late_minutes: lateMinutes,
        status: (isLate ? 'late' : 'present') as 'late' | 'present',
      };
      let event = existing
        ? await trx.updateTable('attendance_event').set(fields).where('event_id', '=', existing.event_id).returningAll().executeTakeFirstOrThrow()
        : await trx
            .insertInto('attendance_event')
            .values({
              employee_id: user.employeeId,
              work_date: ctx.workDate,
              config_id: ctx.configId,
              window_start_at: ctx.windowStartAt,
              latest_start_at: ctx.latestStartAt,
              required_work_minutes: ctx.requiredWorkMinutes,
              ...fields,
            })
            .returningAll()
            .executeTakeFirstOrThrow();

      // The check-in fix is the shift's first location point (and puts the rep on the live map).
      const ping = { ping_id: randomUUID(), recorded_at: now, lat: loc.lat, lng: loc.lng, accuracy_m: loc.accuracyM ?? null };
      await trx
        .insertInto('location_ping')
        .values({ ...ping, employee_id: user.employeeId, attendance_event_id: event.event_id, provider: loc.provider ?? null, is_mock: !!loc.isMock })
        .execute();
      await upsertLive(trx, user.employeeId, event.event_id, ping);

      if (signals.length) {
        const rows = await trx
          .insertInto('fraud_signal')
          .values(signals.map((s) => ({ event_id: event.event_id, phase: 'check_in' as const, type: s.type, evidence: JSON.stringify(s.evidence), detected_at: now })))
          .returning('signal_id')
          .execute();
        await declareCause(trx, { cause: 'fraud_flagged', fraudSignalId: rows[0]!.signal_id });
        event = await trx.updateTable('attendance_event').set({ status: 'suspected_fake' }).where('event_id', '=', event.event_id).returningAll().executeTakeFirstOrThrow();
        // FR-FRAUD-02: tell the administrator immediately.
        const admin = await this.notifications.administrator(trx);
        if (admin) {
          await this.notifications.notify({
            recipientId: admin, type: 'fraud_flagged', messageKey: 'notify.fraudFlagged',
            params: { employeeId: user.employeeId }, data: { eventId: event.event_id, signals: signals.map((s) => s.type) },
          }, trx);
        }
      }
      await this.notifications.notify({
        recipientId: user.employeeId, type: 'check_in', messageKey: 'notify.checkedIn',
        params: { at: now.toISOString() }, data: { eventId: event.event_id },
      }, trx);
      await publishLive(trx, user.employeeId);
    });
    return this.today(user, now);
  }

  async checkOut(user: Principal, input: CheckOutInput, now: Date) {
    const open = await this.openEvent(this.db, user.employeeId);
    if (!open) throw conflict('NOT_CHECKED_IN', 'You are not checked in');
    const worked = Math.max(0, Math.floor((now.getTime() - open.check_in_at!.getTime()) / 60_000));
    if (worked < open.required_work_minutes && !input.confirmShort) {
      throw conflict('SHORT_DAY_CONFIRMATION_REQUIRED', 'Checking out before the required hours needs confirmation', {
        workedMinutes: worked, requiredMinutes: open.required_work_minutes, remainingMinutes: open.required_work_minutes - worked,
      });
    }
    const loc = input.location;
    let insideOut: boolean | null = null;
    if (loc) {
      const geo = await nearestGeofence(this.db, user.employeeId, open.work_date, loc.lat, loc.lng);
      insideOut = geo ? insideGeofence(geo.distanceM, loc.accuracyM) : null;
    }
    await this.db.transaction().execute(async (trx) => {
      if (loc) {
        await trx
          .insertInto('location_ping')
          .values({ ping_id: randomUUID(), employee_id: user.employeeId, attendance_event_id: open.event_id, recorded_at: now, lat: loc.lat, lng: loc.lng, accuracy_m: loc.accuracyM ?? null, provider: loc.provider ?? null, is_mock: !!loc.isMock })
          .execute();
      }
      await trx
        .updateTable('attendance_event')
        .set({
          check_out_at: now,
          check_out_lat: loc?.lat ?? null,
          check_out_lng: loc?.lng ?? null,
          check_out_accuracy_m: loc?.accuracyM ?? null,
          check_out_inside_geofence: insideOut,
          check_out_source: 'employee',
          worked_minutes: worked,
        })
        .where('event_id', '=', open.event_id)
        .execute();
      await this.notifications.notify({
        recipientId: user.employeeId, type: 'check_out', messageKey: worked < open.required_work_minutes ? 'notify.checkedOutShort' : 'notify.checkedOut',
        params: { workedMinutes: worked, requiredMinutes: open.required_work_minutes }, data: { eventId: open.event_id },
      }, trx);
      await publishLive(trx, user.employeeId); // live position was cleared by the database at check-out
    });
    return this.today(user, now);
  }

  // ── Rep: month view + corrections (FR-LVE-02, BR-ATT-02, FR-ATT-07) ──────────────────────────

  async myMonth(user: Principal, month: string) {
    const first = `${month}-01`;
    const rows = await this.db
      .selectFrom('attendance_event')
      .selectAll()
      .where('employee_id', '=', user.employeeId)
      .where('work_date', '>=', first)
      .where(sql<boolean>`work_date < (${first}::date + interval '1 month')`)
      .orderBy('work_date')
      .execute();
    const period = await this.db.selectFrom('attendance_period').select(['status']).where('year', '=', Number(month.slice(0, 4))).where('month', '=', Number(month.slice(5, 7))).executeTakeFirst();
    const corrections = await this.db
      .selectFrom('attendance_correction_request')
      .select(['request_id', 'event_id', 'status', 'reason', 'decision_remark', 'created_at'])
      .where('employee_id', '=', user.employeeId)
      .where('event_id', 'in', rows.length ? rows.map((r) => r.event_id) : ['00000000-0000-0000-0000-000000000000'])
      .execute();
    return {
      month,
      finalized: period?.status === 'finalized',
      counts: monthCounts(rows),
      days: rows.map((r) => ({ ...eventDto(r), corrections: corrections.filter((c) => c.event_id === r.event_id) })),
    };
  }

  async requestCorrection(user: Principal, b: { workDate: string; requestedCheckInAt?: Date; requestedCheckOutAt?: Date; reason: string }) {
    const event = await this.db.selectFrom('attendance_event').selectAll().where('employee_id', '=', user.employeeId).where('work_date', '=', b.workDate).executeTakeFirst();
    if (!event) throw notFound('NO_ATTENDANCE_RECORD', 'There is no attendance record for that day yet');
    const { rows: [lock] } = await sql<{ locked: boolean }>`SELECT attendance_month_locked(${b.workDate}::date) AS locked`.execute(this.db);
    if (lock?.locked) throw conflict('MONTH_FINALIZED', 'This month is finalized; ask HR to re-open it');
    const pending = await this.db.selectFrom('attendance_correction_request').select('request_id').where('event_id', '=', event.event_id).where('status', '=', 'pending').executeTakeFirst();
    if (pending) throw conflict('CORRECTION_PENDING', 'A correction for this day is already waiting for review');
    return this.db
      .insertInto('attendance_correction_request')
      .values({
        event_id: event.event_id, employee_id: user.employeeId, reason: b.reason,
        requested_check_in_at: b.requestedCheckInAt ?? null, requested_check_out_at: b.requestedCheckOutAt ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  // ── Managers: register, detail, review (FR-ATM-01/02/04) ─────────────────────────────────────

  async register(user: Principal, q: { date: string; teamId?: string; status?: string; q?: string }) {
    let query = this.db
      .selectFrom('employee as e')
      .leftJoin('team as t', 't.team_id', 'e.team_id')
      .leftJoin('attendance_event as ev', (j) => j.onRef('ev.employee_id', '=', 'e.employee_id').on('ev.work_date', '=', q.date))
      .select([
        'e.employee_id', 'e.full_name_en', 'e.full_name_ar', 'e.team_id', 't.name_en as team_en', 't.name_ar as team_ar',
        'ev.event_id', 'ev.status', 'ev.check_in_at', 'ev.check_out_at', 'ev.check_out_source', 'ev.is_late', 'ev.late_minutes',
        'ev.worked_minutes', 'ev.shortfall_minutes', 'ev.is_short_hours', 'ev.required_work_minutes', 'ev.check_in_inside_geofence',
      ])
      .where('e.role', '=', 'sales_rep')
      .where('e.status', '=', 'active')
      .where(canSee(user));
    if (q.teamId) query = query.where('e.team_id', '=', q.teamId);
    if (q.status === 'not_checked_in') query = query.where('ev.event_id', 'is', null);
    else if (q.status) query = query.where('ev.status', '=', q.status as EventRow['status']);
    if (q.q) {
      const like = `%${q.q.trim()}%`;
      query = query.where((eb) => eb.or([eb('e.employee_id', 'ilike', like), eb('e.full_name_en', 'ilike', like), eb('e.full_name_ar', 'ilike', like)]));
    }
    const rows = await query.orderBy('e.full_name_en').execute();
    return { date: q.date, rows };
  }

  async eventDetail(user: Principal, eventId: string) {
    const event = await this.db.selectFrom('attendance_event').selectAll().where('event_id', '=', eventId).executeTakeFirst();
    if (!event) throw notFound();
    await assertCanSee(this.db, user, event.employee_id);
    const [employee, signals, trail, corrections, site] = await Promise.all([
      this.db.selectFrom('employee').select(['employee_id', 'full_name_en', 'full_name_ar', 'team_id']).where('employee_id', '=', event.employee_id).executeTakeFirstOrThrow(),
      this.db.selectFrom('fraud_signal').select(['signal_id', 'phase', 'type', 'evidence', 'detected_at']).where('event_id', '=', eventId).orderBy('detected_at').execute(),
      this.db
        .selectFrom('attendance_status_change as c')
        .leftJoin('employee as a', 'a.employee_id', 'c.actor_id')
        .select(['c.change_id', 'c.from_status', 'c.to_status', 'c.cause', 'c.actor_id', 'a.full_name_en as actor_en', 'a.full_name_ar as actor_ar', 'c.reason', 'c.created_at'])
        .where('c.event_id', '=', eventId)
        .orderBy('c.created_at')
        .execute(),
      this.db.selectFrom('attendance_correction_request').selectAll().where('event_id', '=', eventId).orderBy('created_at').execute(),
      event.check_in_geofence_id
        ? this.db.selectFrom('geofence').select(['geofence_id', 'name_en', 'name_ar']).where('geofence_id', '=', event.check_in_geofence_id).executeTakeFirst()
        : Promise.resolve(undefined),
    ]);
    return { event: { ...eventDto(event), checkIn: { lat: event.check_in_lat, lng: event.check_in_lng, accuracyM: event.check_in_accuracy_m }, site: site ?? null }, employee, signals, trail, corrections };
  }

  /** FR-ATM-02 / BR-ATT-01: a person decides, with a remark; never automatic. */
  async review(user: Principal, eventId: string, decision: 'confirm' | 'clear', remark: string, now: Date) {
    const event = await this.db.selectFrom('attendance_event').selectAll().where('event_id', '=', eventId).executeTakeFirst();
    if (!event) throw notFound();
    await assertCanSee(this.db, user, event.employee_id);
    if (event.employee_id === user.employeeId) throw forbidden('SELF_REVIEW', 'You cannot review your own attendance');
    if (event.status !== 'suspected_fake') throw conflict('NOT_SUSPECTED', 'Only a suspected fake check-in can be reviewed');
    const to = decision === 'confirm' ? 'confirmed_fake' : event.is_late ? 'late' : 'present';
    const updated = await this.db.transaction().execute(async (trx) => {
      await declareCause(trx, { cause: decision === 'confirm' ? 'review_confirmed' : 'review_cleared', actorId: user.employeeId, reason: remark });
      const row = await trx
        .updateTable('attendance_event')
        .set({ status: to, reviewed_by: user.employeeId, reviewed_at: now, review_notes: remark })
        .where('event_id', '=', eventId)
        .returningAll()
        .executeTakeFirstOrThrow();
      await this.audit.record({ actorId: user.employeeId, action: `fake_review_${decision}`, entity: 'attendance_event', entityId: eventId, before: { status: event.status }, after: { status: to }, reason: remark }, trx);
      return row;
    });
    return eventDto(updated);
  }

  /** FR-ATM-02 queue: every pending Suspected Fake in scope, oldest first, with its evidence. */
  async suspectedQueue(user: Principal) {
    const rows = await this.db
      .selectFrom('attendance_event as ev')
      .innerJoin('employee as e', 'e.employee_id', 'ev.employee_id')
      .leftJoin('team as t', 't.team_id', 'e.team_id')
      .leftJoin('geofence as g', 'g.geofence_id', 'ev.check_in_geofence_id')
      .select([
        'ev.event_id', 'ev.employee_id', 'e.full_name_en', 'e.full_name_ar', 't.name_en as team_en', 't.name_ar as team_ar', 'ev.work_date',
        'ev.check_in_at', 'ev.check_in_lat', 'ev.check_in_lng', 'ev.check_in_accuracy_m', 'ev.check_in_distance_m', 'ev.is_late', 'g.name_en as site_en', 'g.name_ar as site_ar',
        (eb) => eb.selectFrom('fraud_signal as f').select(sql<unknown>`coalesce(json_agg(json_build_object('type', f.type, 'phase', f.phase, 'evidence', f.evidence, 'detectedAt', f.detected_at) ORDER BY f.detected_at), '[]')`.as('x')).whereRef('f.event_id', '=', 'ev.event_id').as('signals'),
      ])
      .where('ev.status', '=', 'suspected_fake')
      .where(canSee(user))
      .orderBy('ev.check_in_at')
      .execute();
    return rows;
  }

  async listCorrections(user: Principal, status: 'pending' | 'approved' | 'rejected' | 'cancelled') {
    return this.db
      .selectFrom('attendance_correction_request as r')
      .innerJoin('employee as e', 'e.employee_id', 'r.employee_id')
      .innerJoin('attendance_event as ev', 'ev.event_id', 'r.event_id')
      .select([
        'r.request_id', 'r.event_id', 'r.employee_id', 'e.full_name_en', 'e.full_name_ar', 'ev.work_date', 'ev.status as event_status',
        'ev.check_in_at', 'ev.check_out_at', 'r.requested_check_in_at', 'r.requested_check_out_at', 'r.reason', 'r.status', 'r.created_at',
      ])
      .where('r.status', '=', status)
      .where(canSee(user))
      .orderBy('r.created_at')
      .execute();
  }

  async decideCorrection(user: Principal, requestId: string, approve: boolean, remark: string, now: Date) {
    const req = await this.db.selectFrom('attendance_correction_request').selectAll().where('request_id', '=', requestId).executeTakeFirst();
    if (!req) throw notFound();
    await assertCanSee(this.db, user, req.employee_id);
    if (req.employee_id === user.employeeId) throw forbidden('SELF_REVIEW', 'You cannot decide your own correction');
    if (req.status !== 'pending') throw conflict('ALREADY_DECIDED', 'This request has already been decided');

    if (!approve) {
      await this.db.transaction().execute(async (trx) => {
        await trx.updateTable('attendance_correction_request').set({ status: 'rejected', decided_by: user.employeeId, decided_at: now, decision_remark: remark }).where('request_id', '=', requestId).execute();
        await this.notifications.notify({ recipientId: req.employee_id, type: 'correction_decided', messageKey: 'notify.correctionRejected', data: { requestId } }, trx);
      });
      return { status: 'rejected' };
    }

    const event = await this.db.selectFrom('attendance_event').selectAll().where('event_id', '=', req.event_id).executeTakeFirstOrThrow();
    const checkIn = req.requested_check_in_at ?? event.check_in_at;
    const checkOut = req.requested_check_out_at ?? event.check_out_at;
    if (!checkIn) throw unprocessable('CHECK_IN_REQUIRED', 'A check-in time is needed to correct this day');
    if (checkOut && checkOut <= checkIn) throw unprocessable('INVALID_TIMES', 'Check-out must be after check-in');
    const cfg = await this.db.selectFrom('attendance_config').select('grace_minutes').where('config_id', '=', event.config_id).executeTakeFirstOrThrow();
    const isLate = checkIn.getTime() > event.latest_start_at.getTime() + cfg.grace_minutes * 60_000;
    const keepFraudStatus = event.status === 'suspected_fake' || event.status === 'confirmed_fake';
    const status = keepFraudStatus ? event.status : isLate ? 'late' : 'present';

    await this.db.transaction().execute(async (trx) => {
      await declareCause(trx, { cause: 'correction_approved', actorId: user.employeeId, reason: remark, correctionRequestId: requestId });
      await trx
        .updateTable('attendance_event')
        .set({
          check_in_at: checkIn,
          is_late: isLate,
          late_minutes: isLate ? Math.ceil((checkIn.getTime() - event.latest_start_at.getTime()) / 60_000) : 0,
          check_out_at: checkOut,
          check_out_source: checkOut ? (req.requested_check_out_at ? 'correction' : event.check_out_source) : null,
          worked_minutes: checkOut ? Math.floor((checkOut.getTime() - checkIn.getTime()) / 60_000) : null,
          leave_request_id: status === 'on_leave' ? event.leave_request_id : null,
          status,
        })
        .where('event_id', '=', event.event_id)
        .execute();
      await trx.updateTable('attendance_correction_request').set({ status: 'approved', decided_by: user.employeeId, decided_at: now, decision_remark: remark }).where('request_id', '=', requestId).execute();
      await this.audit.record({
        actorId: user.employeeId, action: 'correction_approved', entity: 'attendance_event', entityId: event.event_id,
        before: { checkIn: event.check_in_at, checkOut: event.check_out_at, status: event.status }, after: { checkIn, checkOut, status }, reason: remark,
      }, trx);
      await this.notifications.notify({ recipientId: req.employee_id, type: 'correction_decided', messageKey: 'notify.correctionApproved', data: { requestId } }, trx);
    });
    return { status: 'approved' };
  }

  // ── helpers ────────────────────────────────────────────────────────────────────────────────

  /** The employee's open shift (checked in, not out) — may belong to yesterday for late shifts. */
  openEvent(db: Db | Tx, employeeId: string) {
    return db
      .selectFrom('attendance_event')
      .selectAll()
      .where('employee_id', '=', employeeId)
      .where('check_in_at', 'is not', null)
      .where('check_out_at', 'is', null)
      .orderBy('check_in_at', 'desc')
      .executeTakeFirst();
  }

  approvedLeaveOn(db: Db | Tx, employeeId: string, date: string) {
    return db
      .selectFrom('leave_request')
      .selectAll()
      .where('employee_id', '=', employeeId)
      .where('status', '=', 'approved')
      .where('start_date', '<=', date)
      .where('end_date', '>=', date)
      .executeTakeFirst();
  }
}

/** Month counts with the agreed definitions (proposal §7 Q3, §5.5). */
export function monthCounts(rows: EventRow[]) {
  const attended = rows.filter((r) => r.status === 'present' || r.status === 'late');
  return {
    presentDays: attended.length,
    lateCount: rows.filter((r) => r.status === 'late').length,
    absentDays: rows.filter((r) => r.status === 'absent').length,
    leaveDays: rows.filter((r) => r.status === 'on_leave').length,
    confirmedFakeCount: rows.filter((r) => r.status === 'confirmed_fake').length,
    suspectedPending: rows.filter((r) => r.status === 'suspected_fake').length,
    shortHoursCount: attended.filter((r) => r.is_short_hours).length,
  };
}
