import { Body, Controller, Get, Headers, HttpCode, Inject, Injectable, Module, Param, ParseIntPipe, Post, Query, Res } from '@nestjs/common';
import ExcelJS from 'exceljs';
import type { Response } from 'express';
import { sql } from 'kysely';
import { z } from 'zod';
import { ADMIN, CurrentUser, type Principal, Public, Roles } from '../../common/auth/principal';
import { Now } from '../../common/clock';
import { randomToken, sha256 } from '../../common/crypto';
import { ApiError, conflict, notFound, unauthorized, unprocessable } from '../../common/errors';
import { AuditService } from '../../common/services';
import { Zod } from '../../common/validation';
import { type Db, declareCause, KYSELY } from '../../db/database';
import { JobsModule, JobsService } from '../../jobs/jobs';

const Month = z.object({ year: z.number().int().min(2024).max(2100), month: z.number().int().min(1).max(12) });
const Correction = z.object({ eventId: z.uuid(), status: z.enum(['present', 'late', 'absent']), reason: z.string().trim().min(5).max(1000) });
const Reopen = z.object({ reason: z.string().trim().min(5).max(1000) });

/**
 * Monthly attendance summary (FR-ASM-01..06). Counts are always computed from the day records —
 * HR corrects days (with a reason, in the status trail), never the counts — so every number traces
 * back to the events that produced it. Finalized months are frozen by the database (BR-ATT-04).
 */
@Injectable()
export class SummaryService {
  constructor(@Inject(KYSELY) private readonly db: Db, private readonly audit: AuditService, private readonly jobs: JobsService) {}

  private bounds(year: number, month: number) {
    const first = `${year}-${String(month).padStart(2, '0')}-01`;
    return { first, next: sql<string>`(${first}::date + interval '1 month')::date` };
  }

  async period(year: number, month: number) {
    return this.db.selectFrom('attendance_period').selectAll().where('year', '=', year).where('month', '=', month).executeTakeFirst();
  }

  /** (Re)computes draft summaries for every rep. Missing working days are first marked Absent / On leave. */
  async compute(year: number, month: number, now: Date) {
    const p = await this.period(year, month);
    if (p?.status === 'finalized') throw conflict('MONTH_FINALIZED', 'This month is finalized; re-open it first');
    const { first, next } = this.bounds(year, month);
    // Fill in absences for the month's past days (idempotent).
    const { rows: [span] } = await sql<{ days: number }>`SELECT greatest(0, least(current_date, ${next}) - ${first}::date)::int AS days`.execute(this.db);
    const lookback = Math.round((now.getTime() - Date.parse(`${first}T00:00:00+03:00`)) / 86_400_000);
    if ((span?.days ?? 0) > 0) await this.jobs.markAbsences(now, Math.max(1, Math.min(lookback, 62)));

    await this.db.transaction().execute(async (trx) => {
      await sql`
        INSERT INTO attendance_summary (employee_id, year, month, present_days, absent_days, late_count, confirmed_fake_count, leave_days, short_hours_count, computed_at)
        SELECT e.employee_id, ${year}, ${month},
               count(*) FILTER (WHERE ev.status IN ('present', 'late')),
               count(*) FILTER (WHERE ev.status = 'absent'),
               count(*) FILTER (WHERE ev.status = 'late'),
               count(*) FILTER (WHERE ev.status = 'confirmed_fake'),
               count(*) FILTER (WHERE ev.status = 'on_leave'),
               count(*) FILTER (WHERE ev.status IN ('present', 'late', 'confirmed_fake') AND ev.is_short_hours),
               ${now}
        FROM employee e
        LEFT JOIN attendance_event ev ON ev.employee_id = e.employee_id AND ev.work_date >= ${first}::date AND ev.work_date < ${next}
        WHERE e.role = 'sales_rep' AND (e.status = 'active' OR ev.event_id IS NOT NULL)
        GROUP BY e.employee_id
        ON CONFLICT (employee_id, year, month) DO UPDATE SET
          present_days = excluded.present_days, absent_days = excluded.absent_days, late_count = excluded.late_count,
          confirmed_fake_count = excluded.confirmed_fake_count, leave_days = excluded.leave_days,
          short_hours_count = excluded.short_hours_count, computed_at = excluded.computed_at
        WHERE attendance_summary.status = 'draft'`.execute(trx);
      await trx
        .insertInto('attendance_period')
        .values({ year, month, status: 'draft', computed_at: now })
        .onConflict((oc) => oc.columns(['year', 'month']).doUpdateSet({ computed_at: now, status: sql`CASE WHEN attendance_period.status = 'open' THEN 'draft'::period_status ELSE attendance_period.status END` }))
        .execute();
    });
    return this.view(year, month);
  }

  async view(year: number, month: number, employeeId?: string) {
    const { first, next } = this.bounds(year, month);
    let q = this.db
      .selectFrom('attendance_summary as s')
      .innerJoin('employee as e', 'e.employee_id', 's.employee_id')
      .leftJoin('team as t', 't.team_id', 'e.team_id')
      .select(['s.employee_id', 'e.full_name_en', 'e.full_name_ar', 't.name_en as team_en', 't.name_ar as team_ar', 's.present_days', 's.absent_days', 's.late_count',
        's.confirmed_fake_count', 's.leave_days', 's.short_hours_count', 's.status', 's.version', 's.computed_at', 's.finalized_at'])
      .where('s.year', '=', year).where('s.month', '=', month);
    if (employeeId) q = q.where('s.employee_id', '=', employeeId);
    const rows = await q.orderBy('e.full_name_en').execute();
    const { rows: [pending] } = await sql<{ n: number }>`
      SELECT count(*)::int AS n FROM attendance_event WHERE status = 'suspected_fake' AND work_date >= ${first}::date AND work_date < ${next}`.execute(this.db);
    const p = await this.period(year, month);
    return { year, month, period: p ?? null, pendingSuspected: pending?.n ?? 0, rows };
  }

  days(year: number, month: number, employeeId: string) {
    const { first, next } = this.bounds(year, month);
    return this.db.selectFrom('attendance_event').selectAll().where('employee_id', '=', employeeId).where('work_date', '>=', first).where(sql<boolean>`work_date < ${next}`).orderBy('work_date').execute();
  }

  /** FR-ASM-03: HR corrects a day before finalizing (mandatory reason, status trail cause month_correction). */
  async correctDay(user: Principal, year: number, month: number, b: z.infer<typeof Correction>, now: Date) {
    const ev = await this.db.selectFrom('attendance_event').selectAll().where('event_id', '=', b.eventId).executeTakeFirst();
    if (!ev || !ev.work_date.startsWith(`${year}-${String(month).padStart(2, '0')}`)) throw notFound();
    if (ev.status === 'suspected_fake' || ev.status === 'confirmed_fake') throw conflict('USE_REVIEW', 'Fake check-ins are decided through the review, not a month correction');
    if (b.status !== 'absent' && !ev.check_in_at) throw unprocessable('CHECK_IN_REQUIRED', 'A day without a check-in can only be absent; ask the employee for a correction request');
    await this.db.transaction().execute(async (trx) => {
      await declareCause(trx, { cause: 'month_correction', actorId: user.employeeId, reason: b.reason });
      await trx.updateTable('attendance_event').set({ status: b.status, leave_request_id: null }).where('event_id', '=', b.eventId).execute();
      await this.audit.record({ actorId: user.employeeId, action: 'month_correction', entity: 'attendance_event', entityId: b.eventId, before: { status: ev.status }, after: { status: b.status }, reason: b.reason }, trx);
    });
    return this.compute(year, month, now);
  }

  async finalize(user: Principal, year: number, month: number, now: Date) {
    const v = await this.compute(year, month, now);
    if (v.pendingSuspected > 0) throw conflict('SUSPECTED_PENDING', 'Review every suspected fake check-in in this month first', { count: v.pendingSuspected });
    const { rows: [ended] } = await sql<{ ok: boolean }>`SELECT (${`${year}-${String(month).padStart(2, '0')}-01`}::date + interval '1 month') <= (${now}::timestamptz AT TIME ZONE 'Asia/Riyadh')::date AS ok`.execute(this.db);
    if (!ended?.ok) throw conflict('MONTH_NOT_ENDED', 'A month can be finalized after it ends');
    await this.db.transaction().execute(async (trx) => {
      const reopened = v.period?.status === 'reopened';
      await trx.updateTable('attendance_summary')
        .set((eb) => ({ status: 'finalized', finalized_by: user.employeeId, finalized_at: now, version: reopened ? eb('version', '+', 1) : eb.ref('version') }))
        .where('year', '=', year).where('month', '=', month).execute();
      await trx.updateTable('attendance_period').set({ status: 'finalized', finalized_by: user.employeeId, finalized_at: now }).where('year', '=', year).where('month', '=', month).execute();
      await this.audit.record({ actorId: user.employeeId, action: 'month_finalized', entity: 'attendance_period', entityId: `${year}-${month}`, after: { employees: v.rows.length } }, trx);
    });
    return this.view(year, month);
  }

  /** BR-ATT-04: audited re-open by an HR admin. */
  async reopen(user: Principal, year: number, month: number, reason: string, now: Date) {
    const p = await this.period(year, month);
    if (p?.status !== 'finalized') throw conflict('NOT_FINALIZED', 'Only a finalized month can be re-opened');
    await this.db.transaction().execute(async (trx) => {
      await trx.updateTable('attendance_period').set({ status: 'reopened', reopened_by: user.employeeId, reopened_at: now, reopen_reason: reason }).where('period_id', '=', p.period_id).execute();
      await trx.updateTable('attendance_summary').set({ status: 'draft', finalized_by: null, finalized_at: null }).where('year', '=', year).where('month', '=', month).execute();
      await this.audit.record({ actorId: user.employeeId, action: 'month_reopened', entity: 'attendance_period', entityId: `${year}-${month}`, reason }, trx);
    });
    return this.view(year, month);
  }

  async createApiClient(user: Principal, name: string) {
    const key = `sfms_${randomToken()}`;
    const row = await this.db.insertInto('api_client').values({ name, key_hash: sha256(key), created_by: user.employeeId }).returning('client_id').executeTakeFirstOrThrow();
    await this.audit.record({ actorId: user.employeeId, action: 'api_client_created', entity: 'api_client', entityId: row.client_id, after: { name } });
    return { clientId: row.client_id, name, apiKey: key }; // shown once
  }

  /** FR-ASM-05: finalized counts only, keyed by Employee ID. */
  async hrms(apiKey: string | undefined, year: number, month: number) {
    if (!apiKey) throw unauthorized('API_KEY_REQUIRED', 'Send the x-api-key header');
    const client = await this.db.selectFrom('api_client').select(['client_id', 'status']).where('key_hash', '=', sha256(apiKey)).executeTakeFirst();
    if (!client || client.status !== 'active') throw unauthorized('API_KEY_INVALID', 'Unknown or disabled API key');
    await this.db.updateTable('api_client').set({ last_used_at: new Date() }).where('client_id', '=', client.client_id).execute();
    const p = await this.period(year, month);
    if (p?.status !== 'finalized') throw new ApiError(409, 'NOT_FINALIZED', 'This month has not been finalized yet');
    const rows = await this.db.selectFrom('attendance_summary').select(['employee_id', 'present_days', 'absent_days', 'late_count', 'confirmed_fake_count', 'leave_days', 'short_hours_count', 'version', 'finalized_at'])
      .where('year', '=', year).where('month', '=', month).where('status', '=', 'finalized').orderBy('employee_id').execute();
    return {
      year, month, finalizedAt: p.finalized_at,
      employees: rows.map((r) => ({
        employeeId: r.employee_id, presentDays: r.present_days, absentDays: r.absent_days, lateCount: r.late_count,
        confirmedFakeCount: r.confirmed_fake_count, leaveDays: r.leave_days, shortHoursCount: r.short_hours_count, version: r.version, finalizedAt: r.finalized_at,
      })),
    };
  }
}

const HEADERS = {
  en: ['Employee ID', 'Employee', 'Team', 'Present days', 'Late', 'Absent days', 'Leave days', 'Short days', 'Confirmed fake', 'Status'],
  ar: ['الرقم الوظيفي', 'الموظف', 'الفريق', 'أيام الحضور', 'التأخير', 'أيام الغياب', 'أيام الإجازة', 'أيام بساعات ناقصة', 'تلاعب مؤكد', 'الحالة'],
};

@Controller('summary')
@Roles(...ADMIN)
export class SummaryController {
  constructor(private readonly summary: SummaryService) {}

  @Get(':year/:month')
  view(@Param('year', ParseIntPipe) year: number, @Param('month', ParseIntPipe) month: number) {
    Month.parse({ year, month });
    return this.summary.view(year, month);
  }

  @Get(':year/:month/employees/:id/days')
  days(@Param('year', ParseIntPipe) year: number, @Param('month', ParseIntPipe) month: number, @Param('id') id: string) {
    return this.summary.days(year, month, id);
  }

  @Post(':year/:month/compute') @HttpCode(200)
  compute(@Now() now: Date, @Param('year', ParseIntPipe) year: number, @Param('month', ParseIntPipe) month: number) {
    Month.parse({ year, month });
    return this.summary.compute(year, month, now);
  }

  @Post(':year/:month/corrections') @HttpCode(200)
  correct(@CurrentUser() u: Principal, @Now() now: Date, @Param('year', ParseIntPipe) year: number, @Param('month', ParseIntPipe) month: number, @Body(new Zod(Correction)) b: z.infer<typeof Correction>) {
    return this.summary.correctDay(u, year, month, b, now);
  }

  @Post(':year/:month/finalize') @HttpCode(200)
  finalize(@CurrentUser() u: Principal, @Now() now: Date, @Param('year', ParseIntPipe) year: number, @Param('month', ParseIntPipe) month: number) {
    return this.summary.finalize(u, year, month, now);
  }

  @Post(':year/:month/reopen') @HttpCode(200)
  reopen(@CurrentUser() u: Principal, @Now() now: Date, @Param('year', ParseIntPipe) year: number, @Param('month', ParseIntPipe) month: number, @Body(new Zod(Reopen)) b: z.infer<typeof Reopen>) {
    return this.summary.reopen(u, year, month, b.reason, now);
  }

  /** FR-ASM-04: CSV (UTF-8 with BOM so Excel shows Arabic) or Excel; optionally one employee. */
  @Get(':year/:month/export')
  async export(@Res() res: Response, @Param('year', ParseIntPipe) year: number, @Param('month', ParseIntPipe) month: number,
    @Query('format') format = 'csv', @Query('lang') lang = 'en', @Query('employeeId') employeeId?: string) {
    const ar = lang === 'ar';
    const { rows, period } = await this.summary.view(year, month, employeeId);
    const head = HEADERS[ar ? 'ar' : 'en'];
    const data = rows.map((r) => [r.employee_id, ar ? r.full_name_ar : r.full_name_en, (ar ? r.team_ar : r.team_en) ?? '', r.present_days, r.late_count, r.absent_days, r.leave_days, r.short_hours_count, r.confirmed_fake_count, r.status]);
    const name = `sfms-attendance-${year}-${String(month).padStart(2, '0')}${employeeId ? `-${employeeId}` : ''}`;
    if (format === 'xlsx') {
      const wb = new ExcelJS.Workbook();
      wb.creator = 'ZONA SFMS';
      const ws = wb.addWorksheet(`${year}-${String(month).padStart(2, '0')}`, { views: [{ rightToLeft: ar, state: 'frozen', ySplit: 1 }] });
      ws.addRow(head).font = { bold: true };
      data.forEach((d) => ws.addRow(d));
      ws.columns.forEach((c, i) => (c.width = i === 1 ? 28 : 16));
      ws.addRow([]);
      ws.addRow([ar ? 'حالة الشهر' : 'Month status', period?.status ?? 'open']);
      res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${name}.xlsx"` });
      await wb.xlsx.write(res);
      return res.end();
    }
    const esc = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
    res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${name}.csv"` });
    return res.send('﻿' + [head, ...data].map((r) => r.map(esc).join(',')).join('\r\n'));
  }
}

@Controller('admin/api-clients')
@Roles(...ADMIN)
export class ApiClientController {
  constructor(private readonly summary: SummaryService) {}
  @Post()
  create(@CurrentUser() u: Principal, @Body(new Zod(z.object({ name: z.string().trim().min(2).max(80) }))) b: { name: string }) {
    return this.summary.createApiClient(u, b.name);
  }
}

/** Outbound API for HRMS and other systems (API-key auth, counts only). */
@Controller('hrms/v1')
export class HrmsController {
  constructor(private readonly summary: SummaryService) {}
  @Public()
  @Get('attendance-summaries')
  list(@Headers('x-api-key') key: string | undefined, @Query('year') year: string, @Query('month') month: string) {
    const m = Month.parse({ year: Number(year), month: Number(month) });
    return this.summary.hrms(key, m.year, m.month);
  }
}

@Module({ imports: [JobsModule], controllers: [SummaryController, ApiClientController, HrmsController], providers: [SummaryService] })
export class SummaryModule {}
