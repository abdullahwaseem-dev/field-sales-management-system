import { createHash } from 'node:crypto';
import { Controller, Headers, HttpCode, Inject, Injectable, Logger, Module, Post, Query } from '@nestjs/common';
import { sql } from 'kysely';
import type { Principal } from '../../common/auth/principal';
import { Public } from '../../common/auth/principal';
import { safeEqual } from '../../common/crypto';
import { notFound, unauthorized } from '../../common/errors';
import { CONFIG, type Config } from '../../config';
import { type Db, KYSELY } from '../../db/database';
import { JobsModule, JobsService } from '../../jobs/jobs';
import { AttendanceModule } from '../attendance/attendance.module';
import { AttendanceService } from '../attendance/attendance.service';
import { LeaveModule, LeaveService } from '../leave/leave';
import { LocationModule } from '../location/location.module';
import { LocationService } from '../location/location.service';
import { SalesModule, SalesService } from '../sales/sales';

const RIYADH_OFFSET_MIN = 180; // KSA has no daylight saving
const MINUTE = 60_000;
const PING_EVERY_MIN = 5;
const CUSTOMERS = [
  'Al Noor Grocery', 'Green Valley Supermarket', 'Al Waha Pharmacy', 'Family Mart', 'Sunrise Minimarket', 'Al Majd Hypermarket',
  'Corner Store', 'Al Safa Trading', 'Palm Tree Market', 'Al Rayan Pharmacy', 'Golden Basket', 'Al Fajr Mini Mart',
  'Desert Rose Store', 'City Fresh Market', 'Al Hamra Supplies', 'Blue Lagoon Grocery',
];

/** Deterministic pseudo-random numbers, so re-running a time window replays exactly the same day. */
function rng(seed: string) {
  let h = createHash('sha256').update(seed).digest().readUInt32LE(0);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Stable UUID (v4 layout) from a seed: retried simulator writes are idempotent. */
function seededUuid(seed: string) {
  const h = createHash('sha256').update(seed).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${'89ab'[parseInt(h[16]!, 16) % 4]}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
const localDate = (t: Date) => new Date(t.getTime() + RIYADH_OFFSET_MIN * MINUTE).toISOString().slice(0, 10);
const atLocal = (date: string, minutes: number) => new Date(Date.parse(`${date}T00:00:00Z`) + (minutes - RIYADH_OFFSET_MIN) * MINUTE);
const addDays = (date: string, n: number) => new Date(Date.parse(`${date}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

interface Rep { employeeId: string; deviceId: string; shiftStartMin: number; latestStartMin: number; lat: number; lng: number }
type Step =
  | { at: Date; kind: 'check_in'; mock: boolean }
  | { at: Date; kind: 'ping' }
  | { at: Date; kind: 'visit' | 'order'; n: number }
  | { at: Date; kind: 'check_out' };

/**
 * Public-demo simulator (DEMO_MODE only). Simulated reps (IDs starting "ZN-1") follow a plan that is
 * a pure function of (rep, day): when they arrive (sometimes late), the loop they drive around their
 * office, the customers they visit, orders, the odd mock-location day and short day. `advance(from,to)`
 * replays every step in that window through the real services, so the demo exercises the same rules,
 * fraud checks, notifications and live map as production.
 */
@Injectable()
export class DemoService {
  private readonly log = new Logger('Demo');

  constructor(
    @Inject(KYSELY) private readonly db: Db,
    private readonly attendance: AttendanceService,
    private readonly location: LocationService,
    private readonly sales: SalesService,
    private readonly leave: LeaveService,
    private readonly jobs: JobsService,
  ) {}

  private async reps(): Promise<Rep[]> {
    const { rows } = await sql<Rep>`
      SELECT e.employee_id AS "employeeId", d.device_id AS "deviceId",
             (extract(epoch FROM e.shift_start) / 60)::int AS "shiftStartMin", (extract(epoch FROM e.latest_start) / 60)::int AS "latestStartMin",
             ST_Y(ST_Centroid(coalesce(g.center, g.area)::geometry)) AS lat, ST_X(ST_Centroid(coalesce(g.center, g.area)::geometry)) AS lng
      FROM employee e
      JOIN device d ON d.employee_id = e.employee_id
      JOIN geofence_assignment a ON a.branch_id = e.branch_id AND a.valid_to IS NULL
      JOIN geofence g ON g.geofence_id = a.geofence_id AND g.status = 'active'
      WHERE e.role = 'sales_rep' AND e.status = 'active' AND e.employee_id LIKE 'ZN-1%'
      ORDER BY e.employee_id`.execute(this.db);
    return rows;
  }

  /** The rep's whole day, as timed steps. */
  private plan(rep: Rep, date: string): { steps: Step[]; start: Date; end: Date; theta0: number; radiusKm: number } | null {
    const r = rng(`${rep.employeeId}:${date}`);
    if (r() < 0.05) return null; // absent (the absence job marks it)
    const late = r() < 0.12;
    const offset = late ? rep.latestStartMin - rep.shiftStartMin + 20 + Math.floor(r() * 40) : Math.floor(r() * (rep.latestStartMin - rep.shiftStartMin));
    const duration = r() < 0.08 ? 400 + Math.floor(r() * 50) : 482 + Math.floor(r() * 40);
    const start = atLocal(date, rep.shiftStartMin + offset);
    const end = new Date(start.getTime() + duration * MINUTE);
    const steps: Step[] = [{ at: start, kind: 'check_in', mock: r() < 0.06 }];
    for (let m = PING_EVERY_MIN; m < duration; m += PING_EVERY_MIN) steps.push({ at: new Date(start.getTime() + m * MINUTE), kind: 'ping' });
    const visits = 4 + Math.floor(r() * 5);
    const orders = Math.floor(r() * (visits / 2 + 1));
    for (let i = 0; i < visits; i++) steps.push({ at: new Date(start.getTime() + (40 + ((duration - 80) * (i + r() * 0.6)) / visits) * MINUTE), kind: 'visit', n: i });
    for (let i = 0; i < orders; i++) steps.push({ at: new Date(start.getTime() + (60 + ((duration - 100) * (i + r() * 0.6)) / Math.max(orders, 1)) * MINUTE), kind: 'order', n: i });
    steps.push({ at: end, kind: 'check_out' });
    steps.sort((a, b) => a.at.getTime() - b.at.getTime());
    return { steps, start, end, theta0: r() * Math.PI * 2, radiusKm: 1.2 + r() * 2.8 };
  }

  /** A loop out from the office and back: radius rises and falls over the shift, angle sweeps round. */
  private position(rep: Rep, p: NonNullable<ReturnType<DemoService['plan']>>, at: Date) {
    const span = p.end.getTime() - p.start.getTime();
    const f = Math.min(1, Math.max(0, (at.getTime() - p.start.getTime()) / span));
    const rKm = p.radiusKm * Math.sin(Math.PI * f);
    const theta = p.theta0 + f * Math.PI * 1.6;
    const dLat = (rKm / 111) * Math.cos(theta);
    const dLng = (rKm / (111 * Math.cos((rep.lat * Math.PI) / 180))) * Math.sin(theta);
    return { lat: rep.lat + dLat, lng: rep.lng + dLng, accuracyM: 6 + Math.round(f * 1000) % 14 };
  }

  private principal(rep: Rep): Principal {
    return { employeeId: rep.employeeId, role: 'sales_rep', sessionId: 'demo-simulator', client: 'mobile', deviceId: rep.deviceId, mustChangePassword: false };
  }

  /** Replays every simulated step with a timestamp in (from, to]. Pings older than `pingsSince` are skipped. */
  async advance(from: Date, to: Date, pingsSince = new Date(to.getTime() - 12 * 3_600_000)) {
    const reps = await this.reps();
    let done = 0;
    for (const rep of reps) {
      const user = this.principal(rep);
      for (let date = addDays(localDate(from), -1); date <= localDate(to); date = addDays(date, 1)) {
        const p = this.plan(rep, date);
        if (!p || p.end <= from || p.start > to) continue;
        const pings: { pingId: string; recordedAt: Date; lat: number; lng: number; accuracyM: number }[] = [];
        for (const step of p.steps) {
          if (step.at <= from || step.at > to) continue;
          try {
            if (step.kind === 'check_in') {
              const at = this.position(rep, p, step.at);
              await this.attendance.checkIn(user, { location: { ...at, provider: 'gps', isMock: step.mock } }, step.at);
            } else if (step.kind === 'ping') {
              if (step.at >= pingsSince) pings.push({ pingId: seededUuid(`ping:${rep.employeeId}:${step.at.toISOString()}`), recordedAt: step.at, ...this.position(rep, p, step.at) });
            } else if (step.kind === 'visit' || step.kind === 'order') {
              const c = rng(`${rep.employeeId}:${date}:${step.kind}:${step.n}`);
              const at = this.position(rep, p, step.at);
              await this.sales.log(user, {
                activityId: seededUuid(`activity:${rep.employeeId}:${date}:${step.kind}:${step.n}`),
                kind: step.kind,
                customerName: CUSTOMERS[Math.floor(c() * CUSTOMERS.length)]!,
                note: step.kind === 'order' ? `${2 + Math.floor(c() * 18)} cartons` : undefined,
                lat: at.lat, lng: at.lng, accuracyM: at.accuracyM,
              }, step.at);
            } else {
              if (pings.length) await this.location.ingest(user, pings.splice(0));
              await this.attendance.checkOut(user, { location: { ...this.position(rep, p, step.at), provider: 'gps' }, confirmShort: true }, step.at);
            }
            done++;
          } catch {
            if (step.kind === 'check_in') break; // on leave, already in, holiday rules… the rest of that day doesn't apply
          }
        }
        if (pings.length) await this.location.ingest(user, pings).catch((e: Error) => this.log.warn(`pings ${rep.employeeId}: ${e.message}`));
      }
    }
    return { reps: reps.length, steps: done };
  }

  /** Called every few minutes by the database scheduler. */
  async tick(now: Date) {
    return this.db.transaction().execute(async (trx) => {
      const { rows: [lock] } = await sql<{ ok: boolean }>`SELECT pg_try_advisory_xact_lock(hashtext('sfms-demo-tick')) AS ok`.execute(trx);
      if (!lock?.ok) return { skipped: true };
      const row = await trx.selectFrom('system_setting').select('value').where('key', '=', 'demo.last_tick').executeTakeFirst();
      const last = row ? new Date(row.value as string) : new Date(now.getTime() - 10 * MINUTE);
      const from = new Date(Math.max(last.getTime(), now.getTime() - 2 * 3_600_000)); // bounded catch-up
      const result = await this.advance(from, now);
      await trx.insertInto('system_setting').values({ key: 'demo.last_tick', value: JSON.stringify(now.toISOString()) })
        .onConflict((oc) => oc.column('key').doUpdateSet({ value: JSON.stringify(now.toISOString()) })).execute();
      return result;
    });
  }

  private readonly admin: Principal = { employeeId: 'ZN-00001', role: 'super_admin', sessionId: 'demo-simulator', client: 'portal', deviceId: null, mustChangePassword: false };

  /** Fresh demo, step 1: leave requests in every state (before the days they cover are simulated). */
  async backfillStart(now: Date) {
    const today = localDate(now);
    const rep = (id: string): Principal => ({ employeeId: id, role: 'sales_rep', sessionId: 'demo-simulator', client: 'mobile', deviceId: null, mustChangePassword: false });
    const leaves: [string, number, number, string, 'approve' | 'reject' | 'pending'][] = [
      ['ZN-10388', -9, -8, 'Family wedding in Abha', 'approve'],
      ['ZN-10590', -4, -4, 'Medical appointment', 'approve'],
      ['ZN-10219', 3, 4, 'Moving to a new apartment', 'pending'],
      ['ZN-10471', 6, 6, 'Child’s school event', 'pending'],
      ['ZN-10512', 2, 2, 'Personal errand', 'reject'],
    ];
    for (const [id, a, b, reason, decision] of leaves) {
      const asked = atLocal(addDays(today, Math.min(a, 0) - 3), 600);
      try {
        const req = await this.leave.create(rep(id), { type: 'leave', startDate: addDays(today, a), endDate: addDays(today, b), reason }, asked);
        if (decision !== 'pending') await this.leave.decide(this.admin, req.request_id, decision === 'approve', decision === 'approve' ? 'Approved — enjoy' : 'Peak week, please pick another day', new Date(asked.getTime() + 3 * 3_600_000));
      } catch (e) {
        this.log.warn(`leave ${id}: ${(e as Error).message}`);
      }
    }
    return { leaves: leaves.length };
  }

  /** Step 2 (once per day, oldest first): one local day of simulated activity, up to `now`. */
  backfillDay(now: Date, daysAgo: number) {
    const date = addDays(localDate(now), -daysAgo);
    const from = atLocal(date, 0);
    const to = new Date(Math.min(atLocal(addDays(date, 1), 0).getTime(), now.getTime()));
    return this.advance(from, to, new Date(now.getTime() - 12 * 3_600_000));
  }

  /** Step 3: absences, the older suspected check-ins reviewed (recent ones left for visitors), clock set. */
  async backfillFinish(now: Date, days: number) {
    const today = localDate(now);
    await this.jobs.markAbsences(now, days);
    const old = await this.db.selectFrom('attendance_event').select(['event_id', 'work_date']).where('status', '=', 'suspected_fake').where('work_date', '<', addDays(today, -2)).execute();
    for (const [i, e] of old.entries()) {
      await this.attendance.review(this.admin, e.event_id, i % 3 === 0 ? 'confirm' : 'clear', i % 3 === 0 ? 'Mock-location app found on the phone; discussed with the rep' : 'GPS drift near the tower; rep was at the branch', atLocal(addDays(e.work_date, 1), 600))
        .catch((err: Error) => this.log.warn(`review: ${err.message}`));
    }
    await this.db.insertInto('system_setting').values({ key: 'demo.last_tick', value: JSON.stringify(now.toISOString()) })
      .onConflict((oc) => oc.column('key').doUpdateSet({ value: JSON.stringify(now.toISOString()) })).execute();
    return { reviewed: old.length };
  }

  /** Whole backfill in one process (local use; the nightly reset calls the steps over HTTP). */
  async backfill(now: Date, days = 21) {
    await this.backfillStart(now);
    let steps = 0;
    let reps = 0;
    for (let d = days; d >= 0; d--) {
      const r = await this.backfillDay(now, d);
      steps += r.steps;
      reps = r.reps;
    }
    await this.backfillFinish(now, days);
    return { reps, steps };
  }
}

@Controller('internal/demo')
export class DemoController {
  constructor(@Inject(CONFIG) private readonly config: Config, private readonly demo: DemoService) {}

  @Public()
  @Post('tick')
  @HttpCode(200)
  tick(@Headers('x-jobs-secret') secret?: string) {
    this.authorize(secret);
    return this.demo.tick(new Date());
  }

  /** Nightly reset, after the schema and seed are rebuilt: step=start, then day (daysAgo=21…0), then finish. */
  @Public()
  @Post('backfill')
  @HttpCode(200)
  backfill(@Headers('x-jobs-secret') secret: string | undefined, @Query('step') step: string, @Query('daysAgo') daysAgo?: string, @Query('days') days?: string) {
    this.authorize(secret);
    const now = new Date();
    if (step === 'start') return this.demo.backfillStart(now);
    if (step === 'day') return this.demo.backfillDay(now, Math.min(60, Math.max(0, Number(daysAgo) || 0)));
    if (step === 'finish') return this.demo.backfillFinish(now, Math.min(60, Math.max(1, Number(days) || 21)));
    throw notFound();
  }

  private authorize(secret?: string) {
    if (!this.config.DEMO_MODE) throw notFound();
    if (!this.config.JOBS_SECRET || !secret || !safeEqual(secret, this.config.JOBS_SECRET)) throw unauthorized();
  }
}

@Module({ imports: [AttendanceModule, LocationModule, SalesModule, LeaveModule, JobsModule], controllers: [DemoController], providers: [DemoService], exports: [DemoService] })
export class DemoModule {}
