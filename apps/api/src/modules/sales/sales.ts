import { Body, Controller, Delete, Get, HttpCode, Inject, Injectable, Module, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { sql } from 'kysely';
import { z } from 'zod';
import { ADMIN, CurrentUser, type Principal, Roles } from '../../common/auth/principal';
import { Now } from '../../common/clock';
import { badRequest, conflict, notFound } from '../../common/errors';
import { AuditService } from '../../common/services';
import { Zod } from '../../common/validation';
import { type Db, KYSELY } from '../../db/database';
import { dayContext } from '../attendance/context';
import { NotificationService, NotificationsModule } from '../notifications/notifications';

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM');
const count = z.number().int().min(0).max(100000);
const TargetBody = z.object({ visits: count, orders: count, note: z.string().trim().max(500).optional() })
  .refine((b) => b.visits > 0 || b.orders > 0, { message: 'Set at least one visit or order', path: ['visits'] });
const BulkBody = z.object({
  month, visits: count, orders: count, note: z.string().trim().max(500).optional(),
  employeeIds: z.array(z.string()).max(5000).optional(), // default: every active sales rep
  overwrite: z.boolean().default(false),
}).refine((b) => b.visits > 0 || b.orders > 0, { message: 'Set at least one visit or order', path: ['visits'] });
const ActivityBody = z.object({
  activityId: z.uuid(),
  kind: z.enum(['visit', 'order']),
  customerName: z.string().trim().min(1).max(120),
  note: z.string().trim().max(500).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  accuracyM: z.number().min(0).max(100000).optional(),
}).refine((b) => (b.lat === undefined) === (b.lng === undefined), { message: 'lat and lng go together', path: ['lat'] });
const VoidBody = z.object({ reason: z.string().trim().min(3).max(500) });

const firstDay = (m: string) => `${m}-01`;
const parseMonth = (m: string) => {
  if (!month.safeParse(m).success) throw badRequest('INVALID_MONTH', 'Use YYYY-MM');
  return m;
};
const riyadhMonth = (now: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit' }).format(now).slice(0, 7);

/**
 * Monthly sales targets, counted in customer visits and orders (never money). The administrator sets
 * them; reps log each visit/order in the app while checked in and see their progress.
 */
@Injectable()
export class SalesService {
  constructor(
    @Inject(KYSELY) private readonly db: Db,
    private readonly notifications: NotificationService,
    private readonly audit: AuditService,
  ) {}

  private done(employeeIds: string[] | null, m: string) {
    let q = this.db
      .selectFrom('sales_activity')
      .select(['employee_id', sql<number>`count(*) FILTER (WHERE kind = 'visit')::int`.as('visits'), sql<number>`count(*) FILTER (WHERE kind = 'order')::int`.as('orders')])
      .where('voided_at', 'is', null)
      .where('work_date', '>=', firstDay(m))
      .where('work_date', '<', sql<string>`(${firstDay(m)}::date + interval '1 month')::date`)
      .groupBy('employee_id');
    if (employeeIds) q = q.where('employee_id', 'in', employeeIds);
    return q.execute();
  }

  // ── Rep (mobile) ───────────────────────────────────────────────────────────────────────────
  async mine(user: Principal, m: string | undefined, now: Date) {
    const ctx = await dayContext(this.db, user.employeeId, now);
    const target = m ?? ctx.workDate.slice(0, 7);
    const [t, [d], open, activities] = await Promise.all([
      this.db.selectFrom('sales_target').select(['visits_target', 'orders_target', 'note', 'updated_at']).where('employee_id', '=', user.employeeId).where('month', '=', firstDay(target)).executeTakeFirst(),
      this.done([user.employeeId], target),
      this.db.selectFrom('attendance_event').select('event_id').where('employee_id', '=', user.employeeId).where('check_in_at', 'is not', null).where('check_out_at', 'is', null).executeTakeFirst(),
      this.db.selectFrom('sales_activity')
        .select(['activity_id', 'kind', 'customer_name', 'note', 'occurred_at', 'work_date', 'voided_at', 'void_reason'])
        .where('employee_id', '=', user.employeeId)
        .where('work_date', '>=', firstDay(target))
        .where('work_date', '<', sql<string>`(${firstDay(target)}::date + interval '1 month')::date`)
        .orderBy('occurred_at', 'desc').limit(200).execute(),
    ]);
    return {
      month: target,
      target: t ? { visits: t.visits_target, orders: t.orders_target, note: t.note, updatedAt: t.updated_at } : null,
      done: { visits: d?.visits ?? 0, orders: d?.orders ?? 0 },
      onDuty: !!open,
      activities: activities.map((a) => ({
        id: a.activity_id, kind: a.kind, customerName: a.customer_name, note: a.note, occurredAt: a.occurred_at, workDate: a.work_date,
        voided: !!a.voided_at, voidReason: a.void_reason,
      })),
    };
  }

  async log(user: Principal, b: z.infer<typeof ActivityBody>, now: Date) {
    const existing = await this.db.selectFrom('sales_activity').select(['activity_id', 'employee_id']).where('activity_id', '=', b.activityId).executeTakeFirst();
    if (existing) {
      if (existing.employee_id !== user.employeeId) throw conflict('DUPLICATE', 'This already exists');
      return { id: existing.activity_id, duplicate: true }; // safe retry from the app
    }
    const event = await this.db.selectFrom('attendance_event').select(['event_id', 'work_date'])
      .where('employee_id', '=', user.employeeId).where('check_in_at', 'is not', null).where('check_out_at', 'is', null)
      .orderBy('check_in_at', 'desc').executeTakeFirst();
    if (!event) throw conflict('NOT_ON_DUTY', 'Check in before logging visits and orders');
    await this.db.insertInto('sales_activity').values({
      activity_id: b.activityId, employee_id: user.employeeId, attendance_event_id: event.event_id, work_date: event.work_date,
      kind: b.kind, customer_name: b.customerName, note: b.note || null, occurred_at: now,
      lat: b.lat ?? null, lng: b.lng ?? null, accuracy_m: b.accuracyM ?? null,
    }).execute();
    return { id: b.activityId, duplicate: false };
  }

  // ── Administrator (portal) ─────────────────────────────────────────────────────────────────
  async targets(m: string) {
    const [reps, done] = await Promise.all([
      this.db.selectFrom('employee as e')
        .innerJoin('branch as b', 'b.branch_id', 'e.branch_id')
        .leftJoin('team as t', 't.team_id', 'e.team_id')
        .leftJoin('sales_target as st', (j) => j.onRef('st.employee_id', '=', 'e.employee_id').on('st.month', '=', firstDay(m)))
        .select(['e.employee_id', 'e.full_name_en', 'e.full_name_ar', 'b.name_en as branch_en', 'b.name_ar as branch_ar', 't.name_en as team_en', 't.name_ar as team_ar',
          'st.visits_target', 'st.orders_target', 'st.note', 'st.updated_at'])
        .where('e.role', '=', 'sales_rep').where('e.status', '=', 'active')
        .orderBy('e.full_name_en').execute(),
      this.done(null, m),
    ]);
    const byId = new Map(done.map((d) => [d.employee_id, d]));
    return reps.map((r) => ({ ...r, visits_done: byId.get(r.employee_id)?.visits ?? 0, orders_done: byId.get(r.employee_id)?.orders ?? 0 }));
  }

  private async assertRep(employeeId: string) {
    const e = await this.db.selectFrom('employee').select(['role', 'status']).where('employee_id', '=', employeeId).executeTakeFirst();
    if (!e) throw notFound();
    if (e.role !== 'sales_rep') throw badRequest('NOT_A_REP', 'Targets are for sales representatives');
  }

  async setTarget(user: Principal, employeeId: string, m: string, b: z.infer<typeof TargetBody>) {
    await this.assertRep(employeeId);
    await this.db.transaction().execute(async (trx) => {
      const before = await trx.selectFrom('sales_target').selectAll().where('employee_id', '=', employeeId).where('month', '=', firstDay(m)).executeTakeFirst();
      await trx.insertInto('sales_target')
        .values({ employee_id: employeeId, month: firstDay(m), visits_target: b.visits, orders_target: b.orders, note: b.note || null, set_by: user.employeeId })
        .onConflict((oc) => oc.columns(['employee_id', 'month']).doUpdateSet({ visits_target: b.visits, orders_target: b.orders, note: b.note || null, set_by: user.employeeId }))
        .execute();
      await this.notifications.notify({ recipientId: employeeId, type: 'target_set', messageKey: 'notify.targetSet', params: { month: m, visits: b.visits, orders: b.orders } }, trx);
      await this.audit.record({ actorId: user.employeeId, action: before ? 'target_updated' : 'target_set', entity: 'sales_target', entityId: `${employeeId}:${m}`, before, after: b }, trx);
    });
    return { employeeId, month: m, ...b };
  }

  async bulk(user: Principal, b: z.infer<typeof BulkBody>) {
    return this.db.transaction().execute(async (trx) => {
      let q = trx.selectFrom('employee').select('employee_id').where('role', '=', 'sales_rep').where('status', '=', 'active');
      if (b.employeeIds?.length) q = q.where('employee_id', 'in', b.employeeIds);
      const reps = (await q.execute()).map((r) => r.employee_id);
      if (!reps.length) return { applied: 0, skipped: 0 };
      const values = reps.map((id) => ({ employee_id: id, month: firstDay(b.month), visits_target: b.visits, orders_target: b.orders, note: b.note || null, set_by: user.employeeId }));
      const rows = await trx.insertInto('sales_target').values(values)
        .onConflict((oc) => (b.overwrite
          ? oc.columns(['employee_id', 'month']).doUpdateSet({ visits_target: b.visits, orders_target: b.orders, note: b.note || null, set_by: user.employeeId })
          : oc.columns(['employee_id', 'month']).doNothing()))
        .returning('employee_id').execute();
      const applied = rows.map((r) => r.employee_id);
      if (applied.length) {
        await this.notifications.notify(applied.map((id) => ({ recipientId: id, type: 'target_set' as const, messageKey: 'notify.targetSet', params: { month: b.month, visits: b.visits, orders: b.orders } })), trx);
      }
      await this.audit.record({ actorId: user.employeeId, action: 'targets_bulk_set', entity: 'sales_target', entityId: b.month, after: { ...b, applied: applied.length } }, trx);
      return { applied: applied.length, skipped: reps.length - applied.length };
    });
  }

  async removeTarget(user: Principal, employeeId: string, m: string) {
    const row = await this.db.deleteFrom('sales_target').where('employee_id', '=', employeeId).where('month', '=', firstDay(m)).returningAll().executeTakeFirst();
    if (!row) throw notFound();
    await this.audit.record({ actorId: user.employeeId, action: 'target_removed', entity: 'sales_target', entityId: `${employeeId}:${m}`, before: row });
  }

  activities(f: { month: string; employeeId?: string; kind?: 'visit' | 'order' }) {
    let q = this.db.selectFrom('sales_activity as a').innerJoin('employee as e', 'e.employee_id', 'a.employee_id')
      .select(['a.activity_id', 'a.employee_id', 'e.full_name_en', 'e.full_name_ar', 'a.kind', 'a.customer_name', 'a.note', 'a.occurred_at', 'a.work_date',
        'a.lat', 'a.lng', 'a.voided_at', 'a.void_reason'])
      .where('a.work_date', '>=', firstDay(f.month))
      .where('a.work_date', '<', sql<string>`(${firstDay(f.month)}::date + interval '1 month')::date`);
    if (f.employeeId) q = q.where('a.employee_id', '=', f.employeeId);
    if (f.kind) q = q.where('a.kind', '=', f.kind);
    return q.orderBy('a.occurred_at', 'desc').limit(1000).execute();
  }

  async voidActivity(user: Principal, id: string, reason: string, now: Date) {
    const row = await this.db.updateTable('sales_activity').set({ voided_at: now, voided_by: user.employeeId, void_reason: reason })
      .where('activity_id', '=', id).where('voided_at', 'is', null).returning(['activity_id', 'employee_id', 'kind']).executeTakeFirst();
    if (!row) throw notFound();
    await this.audit.record({ actorId: user.employeeId, action: 'sales_activity_voided', entity: 'sales_activity', entityId: id, after: { reason } });
    return row;
  }
}

@Controller('sales')
export class SalesController {
  constructor(private readonly sales: SalesService) {}

  @Get('me') @Roles('sales_rep')
  mine(@CurrentUser() u: Principal, @Now() now: Date, @Query('month') m?: string) {
    return this.sales.mine(u, m === undefined ? undefined : parseMonth(m), now);
  }

  @Post('activities') @HttpCode(201) @Roles('sales_rep')
  log(@CurrentUser() u: Principal, @Now() now: Date, @Body(new Zod(ActivityBody)) b: z.infer<typeof ActivityBody>) {
    return this.sales.log(u, b, now);
  }
}

@Controller('admin')
export class SalesAdminController {
  constructor(private readonly sales: SalesService) {}

  @Get('targets') @Roles(...ADMIN)
  targets(@Now() now: Date, @Query('month') m?: string) {
    return this.sales.targets(m ? parseMonth(m) : riyadhMonth(now));
  }

  @Put('targets/:employeeId/:month') @Roles(...ADMIN)
  set(@CurrentUser() u: Principal, @Param('employeeId') id: string, @Param('month') m: string, @Body(new Zod(TargetBody)) b: z.infer<typeof TargetBody>) {
    return this.sales.setTarget(u, id, parseMonth(m), b);
  }

  @Post('targets/bulk') @HttpCode(200) @Roles(...ADMIN)
  bulk(@CurrentUser() u: Principal, @Body(new Zod(BulkBody)) b: z.infer<typeof BulkBody>) {
    return this.sales.bulk(u, b);
  }

  @Delete('targets/:employeeId/:month') @HttpCode(204) @Roles(...ADMIN)
  remove(@CurrentUser() u: Principal, @Param('employeeId') id: string, @Param('month') m: string) {
    return this.sales.removeTarget(u, id, parseMonth(m));
  }

  @Get('sales/activities') @Roles(...ADMIN)
  activities(@Now() now: Date, @Query('month') m?: string, @Query('employeeId') employeeId?: string, @Query('kind') kind?: string) {
    return this.sales.activities({ month: m ? parseMonth(m) : riyadhMonth(now), employeeId: employeeId || undefined, kind: kind === 'visit' || kind === 'order' ? kind : undefined });
  }

  @Post('sales/activities/:id/void') @HttpCode(200) @Roles(...ADMIN)
  void(@CurrentUser() u: Principal, @Now() now: Date, @Param('id', ParseUUIDPipe) id: string, @Body(new Zod(VoidBody)) b: z.infer<typeof VoidBody>) {
    return this.sales.voidActivity(u, id, b.reason, now);
  }
}

@Module({ imports: [NotificationsModule], controllers: [SalesController, SalesAdminController], providers: [SalesService], exports: [SalesService] })
export class SalesModule {}
