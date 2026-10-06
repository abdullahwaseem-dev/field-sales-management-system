import { Controller, Headers, HttpCode, Inject, Injectable, Logger, Module, type OnApplicationBootstrap, type OnApplicationShutdown, Param, Post } from '@nestjs/common';
import { Public } from '../common/auth/principal';
import { safeEqual } from '../common/crypto';
import { notFound, unauthorized } from '../common/errors';
import { sql } from 'kysely';
import { SettingsService } from '../common/services';
import { CONFIG, type Config } from '../config';
import { type Db, declareCause, KYSELY, type Tx } from '../db/database';
import { publishLive } from '../modules/location/live';
import { NotificationService, NotificationsModule } from '../modules/notifications/notifications';

/**
 * Background jobs. Each run takes a transaction-scoped advisory lock, so with several API instances
 * exactly one runs a given job at a time (no extra queue infrastructure needed for V1).
 */
@Injectable()
export class JobsService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly log = new Logger('Jobs');
  private readonly timers: NodeJS.Timeout[] = [];

  constructor(
    @Inject(KYSELY) private readonly db: Db,
    @Inject(CONFIG) private readonly config: Config,
    private readonly settings: SettingsService,
    private readonly notifications: NotificationService,
  ) {}

  onApplicationBootstrap() {
    if (!this.config.JOBS_ENABLED || this.config.NODE_ENV === 'test') return;
    this.every('shift-timeout', 60_000, () => this.closeTimedOutShifts(new Date()));
    this.every('reminders', 5 * 60_000, () => this.sendReminders(new Date()));
    this.every('absences', 30 * 60_000, () => this.markAbsences(new Date()));
    this.every('partitions', 6 * 3_600_000, () => this.maintainPartitions());
    this.every('retention', 24 * 3_600_000, () => this.applyRetention());
  }

  onApplicationShutdown() {
    this.timers.forEach(clearInterval);
  }

  private every(name: string, ms: number, fn: () => Promise<unknown>) {
    const run = () => fn().catch((e: Error) => this.log.error(`${name}: ${e.message}`));
    setTimeout(run, 5_000 + Math.random() * 5_000); // soon after boot, staggered
    this.timers.push(setInterval(run, ms));
  }

  /** Runs `fn` only if no other instance holds the lock for `name`. */
  private async locked<T>(name: string, fn: (trx: Tx) => Promise<T>): Promise<T | undefined> {
    return this.db.transaction().execute(async (trx) => {
      const { rows: [r] } = await sql<{ ok: boolean }>`SELECT pg_try_advisory_xact_lock(hashtext(${`sfms-job:${name}`})) AS ok`.execute(trx);
      return r?.ok ? fn(trx) : undefined;
    });
  }

  /** FR-LOC-03: shifts left open past the timeout are closed at the last known on-duty point. */
  closeTimedOutShifts(now: Date) {
    return this.locked('shift-timeout', async (trx) => {
      const { rows } = await sql<{ event_id: string; employee_id: string; check_in_at: Date; timeout_at: Date; last_ping: Date | null }>`
        SELECT ev.event_id, ev.employee_id, ev.check_in_at,
               ev.check_in_at + make_interval(hours => c.shift_timeout_hours) AS timeout_at,
               (SELECT max(recorded_at) FROM location_ping p WHERE p.attendance_event_id = ev.event_id) AS last_ping
        FROM attendance_event ev JOIN attendance_config c ON c.config_id = ev.config_id
        WHERE ev.check_in_at IS NOT NULL AND ev.check_out_at IS NULL
          AND ev.check_in_at + make_interval(hours => c.shift_timeout_hours) < ${now}`.execute(trx);
      for (const r of rows) {
        const out = new Date(Math.min(r.timeout_at.getTime(), Math.max(r.check_in_at.getTime(), r.last_ping?.getTime() ?? 0)));
        await trx
          .updateTable('attendance_event')
          .set({ check_out_at: out, check_out_source: 'shift_timeout', worked_minutes: Math.floor((out.getTime() - r.check_in_at.getTime()) / 60_000) })
          .where('event_id', '=', r.event_id)
          .execute();
        await this.notifications.notify({ recipientId: r.employee_id, type: 'check_out', messageKey: 'notify.autoCheckedOut', data: { eventId: r.event_id } }, trx);
        await publishLive(trx, r.employee_id);
      }
      if (rows.length) this.log.log(`closed ${rows.length} timed-out shift(s)`);
      return rows.length;
    });
  }

  /** Late warning 15 min before the latest on-time start; "required hours complete" (8-hour rule). */
  sendReminders(now: Date) {
    return this.locked('reminders', async (trx) => {
      const late = await sql<{ employee_id: string; latest_start_at: Date }>`
        WITH r AS (
          SELECT e.employee_id, e.branch_id, e.weekly_off_days,
                 (${now}::timestamptz AT TIME ZONE b.timezone)::date AS d,
                 ((${now}::timestamptz AT TIME ZONE b.timezone)::date + e.latest_start) AT TIME ZONE b.timezone AS latest_start_at
          FROM employee e JOIN branch b ON b.branch_id = e.branch_id
          WHERE e.role = 'sales_rep' AND e.status = 'active')
        SELECT r.employee_id, r.latest_start_at FROM r
        WHERE ${now} >= r.latest_start_at - interval '15 minutes' AND ${now} < r.latest_start_at
          AND NOT (extract(isodow FROM r.d)::int = ANY (r.weekly_off_days))
          AND NOT EXISTS (SELECT 1 FROM holiday h WHERE h.date = r.d AND (h.branch_id IS NULL OR h.branch_id = r.branch_id))
          AND NOT EXISTS (SELECT 1 FROM attendance_event ev WHERE ev.employee_id = r.employee_id AND ev.work_date = r.d)
          AND NOT EXISTS (SELECT 1 FROM leave_request l WHERE l.employee_id = r.employee_id AND l.status = 'approved' AND r.d BETWEEN l.start_date AND l.end_date)
          AND NOT EXISTS (SELECT 1 FROM notification n WHERE n.recipient_id = r.employee_id AND n.type = 'late_warning' AND n.created_at > ${now}::timestamptz - interval '1 hour')`.execute(trx);
      await this.notifications.notify(late.rows.map((r) => ({
        recipientId: r.employee_id, type: 'late_warning' as const, messageKey: 'notify.lateWarning', params: { latestStartAt: r.latest_start_at.toISOString() },
      })), trx);

      const done = await sql<{ employee_id: string; event_id: string }>`
        SELECT ev.employee_id, ev.event_id FROM attendance_event ev
        WHERE ev.check_in_at IS NOT NULL AND ev.check_out_at IS NULL
          AND ${now} >= ev.check_in_at + make_interval(mins => ev.required_work_minutes)
          AND NOT EXISTS (SELECT 1 FROM notification n WHERE n.recipient_id = ev.employee_id AND n.type = 'hours_completed' AND n.data->>'eventId' = ev.event_id::text)`.execute(trx);
      await this.notifications.notify(done.rows.map((r) => ({
        recipientId: r.employee_id, type: 'hours_completed' as const, messageKey: 'notify.hoursCompleted', data: { eventId: r.event_id },
      })), trx);
      return late.rows.length + done.rows.length;
    });
  }

  /**
   * Scheduled working days (not weekly off, not a holiday) with no attendance record become Absent,
   * or On leave when an approved leave covers them (FR-ASM-02, BR-ATT-03). Looks back `days` days so
   * a missed run is caught up. Only days after the employee joined.
   */
  markAbsences(now: Date, days = 7) {
    return this.locked('absences', async (trx) => {
      const { rows } = await sql<{ employee_id: string; work_date: string; window_start_at: Date; latest_start_at: Date; config_id: string; required_work_minutes: number; leave_id: string | null }>`
        WITH reps AS (
          SELECT e.employee_id, e.team_id, e.branch_id, b.timezone, e.shift_start, e.latest_start, e.weekly_off_days,
                 (e.created_at AT TIME ZONE b.timezone)::date AS joined,
                 (${now}::timestamptz AT TIME ZONE b.timezone)::date AS today
          FROM employee e JOIN branch b ON b.branch_id = e.branch_id
          WHERE e.role = 'sales_rep' AND e.status = 'active'),
        days AS (
          SELECT r.*, gs::date AS work_date FROM reps r
          CROSS JOIN LATERAL generate_series(r.today - ${days}::int, r.today - 1, interval '1 day') gs)
        SELECT d.employee_id, d.work_date::text AS work_date,
               (d.work_date + d.shift_start) AT TIME ZONE d.timezone AS window_start_at,
               (d.work_date + d.latest_start) AT TIME ZONE d.timezone AS latest_start_at,
               c.config_id, c.required_work_minutes,
               (SELECT l.request_id FROM leave_request l WHERE l.employee_id = d.employee_id AND l.status = 'approved'
                  AND d.work_date BETWEEN l.start_date AND l.end_date LIMIT 1) AS leave_id
        FROM days d CROSS JOIN LATERAL effective_attendance_config(d.team_id, d.work_date) c
        WHERE d.work_date >= d.joined
          AND c.config_id IS NOT NULL
          AND NOT (extract(isodow FROM d.work_date)::int = ANY (d.weekly_off_days))
          AND NOT EXISTS (SELECT 1 FROM holiday h WHERE h.date = d.work_date AND (h.branch_id IS NULL OR h.branch_id = d.branch_id))
          AND NOT EXISTS (SELECT 1 FROM attendance_event ev WHERE ev.employee_id = d.employee_id AND ev.work_date = d.work_date)
          AND NOT attendance_month_locked(d.work_date)`.execute(trx);
      for (const r of rows) {
        await declareCause(trx, r.leave_id ? { cause: 'leave_approved', leaveRequestId: r.leave_id, reason: 'Approved leave' } : { cause: 'absent_marked' });
        await trx
          .insertInto('attendance_event')
          .values({
            employee_id: r.employee_id, work_date: r.work_date, config_id: r.config_id, window_start_at: r.window_start_at,
            latest_start_at: r.latest_start_at, required_work_minutes: r.required_work_minutes,
            status: r.leave_id ? 'on_leave' : 'absent', leave_request_id: r.leave_id,
          })
          .execute();
      }
      if (rows.length) this.log.log(`marked ${rows.length} absent/leave day(s)`);
      return rows.length;
    });
  }

  maintainPartitions() {
    return this.locked('partitions', async (trx) => {
      const { rows: [r] } = await sql<{ n: number }>`SELECT ensure_location_ping_partitions(2) AS n`.execute(trx);
      return r?.n ?? 0;
    });
  }

  /** SRS §5.6: raw location pings are deleted after the configured retention period. */
  applyRetention() {
    return this.locked('retention', async (trx) => {
      const months = await this.settings.get<number>('location.retention_months', 12);
      const { rows: [r] } = await sql<{ n: number }>`SELECT drop_location_ping_partitions_older_than(${months}::int) AS n`.execute(trx);
      if (r?.n) this.log.log(`retention: dropped ${r.n} monthly ping partition(s) older than ${months} months`);
      return r?.n ?? 0;
    });
  }
}

/**
 * On serverless hosting there is no long-running process for timers: the database scheduler
 * (pg_cron + pg_net) calls these endpoints instead, authenticated with JOBS_SECRET.
 */
@Controller('internal/jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService, @Inject(CONFIG) private readonly config: Config) {}

  @Public()
  @Post(':name')
  @HttpCode(200)
  async run(@Param('name') name: string, @Headers('x-jobs-secret') secret?: string) {
    if (!this.config.JOBS_SECRET || !secret || !safeEqual(secret, this.config.JOBS_SECRET)) throw unauthorized();
    const now = new Date();
    const run: Record<string, () => Promise<unknown>> = {
      'shift-timeout': () => this.jobs.closeTimedOutShifts(now),
      reminders: () => this.jobs.sendReminders(now),
      absences: () => this.jobs.markAbsences(now),
      partitions: () => this.jobs.maintainPartitions(),
      retention: () => this.jobs.applyRetention(),
    };
    if (!run[name]) throw notFound();
    return { job: name, result: (await run[name]()) ?? null };
  }
}

@Module({ imports: [NotificationsModule], controllers: [JobsController], providers: [JobsService], exports: [JobsService] })
export class JobsModule {}
