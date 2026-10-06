import { Body, Controller, Get, HttpCode, Inject, Injectable, Module, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { sql } from 'kysely';
import { z } from 'zod';
import { ADMIN, CurrentUser, type Principal, Roles } from '../../common/auth/principal';
import { Now } from '../../common/clock';
import { badRequest, conflict, forbidden, notFound } from '../../common/errors';
import { assertCanSee, canSee } from '../../common/scope';
import { AuditService } from '../../common/services';
import { Zod } from '../../common/validation';
import { type Db, declareCause, KYSELY } from '../../db/database';
import { dayContext } from '../attendance/context';
import { NotificationService, NotificationsModule } from '../notifications/notifications';

/** FR-LVE-01 (request/status), UC-06 (supervisor decides), FR-ASM-02 (approved leave is not absence). */
@Injectable()
export class LeaveService {
  constructor(
    @Inject(KYSELY) private readonly db: Db,
    private readonly notifications: NotificationService,
    private readonly audit: AuditService,
  ) {}

  async create(user: Principal, b: { type: 'leave' | 'off_day'; startDate: string; endDate: string; reason: string }, now: Date) {
    if (b.endDate < b.startDate) throw badRequest('INVALID_RANGE', 'End date is before start date');
    const days = (Date.parse(b.endDate) - Date.parse(b.startDate)) / 86_400_000 + 1;
    if (days > 60) throw badRequest('RANGE_TOO_LONG', 'A request can cover at most 60 days');
    const ctx = await dayContext(this.db, user.employeeId, now);
    const { rows: [lock] } = await sql<{ locked: boolean }>`SELECT attendance_month_locked(${b.startDate}::date) AS locked`.execute(this.db);
    if (lock?.locked) throw conflict('MONTH_FINALIZED', 'That month is finalized');
    if (b.startDate < ctx.workDate.slice(0, 8) + '01') throw badRequest('TOO_FAR_BACK', 'Leave can be requested back to the start of this month');
    const row = await this.db
      .insertInto('leave_request')
      .values({ employee_id: user.employeeId, type: b.type, start_date: b.startDate, end_date: b.endDate, reason: b.reason })
      .returningAll()
      .executeTakeFirstOrThrow();
    return row;
  }

  mine(user: Principal) {
    return this.db.selectFrom('leave_request').selectAll().where('employee_id', '=', user.employeeId).orderBy('start_date', 'desc').limit(100).execute();
  }

  async cancel(user: Principal, id: string, now: Date) {
    const req = await this.db.selectFrom('leave_request').selectAll().where('request_id', '=', id).executeTakeFirst();
    if (!req || req.employee_id !== user.employeeId) throw notFound();
    if (req.status !== 'pending' && req.status !== 'approved') throw conflict('NOT_CANCELLABLE', 'This request can no longer be cancelled');
    const ctx = await dayContext(this.db, user.employeeId, now);
    if (req.status === 'approved' && req.start_date <= ctx.workDate) {
      throw conflict('LEAVE_STARTED', 'Leave that has started can only be changed by HR');
    }
    return this.db.updateTable('leave_request').set({ status: 'cancelled' }).where('request_id', '=', id).returningAll().executeTakeFirstOrThrow();
  }

  list(user: Principal, status: 'pending' | 'approved' | 'rejected' | 'cancelled') {
    return this.db
      .selectFrom('leave_request as r')
      .innerJoin('employee as e', 'e.employee_id', 'r.employee_id')
      .select(['r.request_id', 'r.employee_id', 'e.full_name_en', 'e.full_name_ar', 'r.type', 'r.start_date', 'r.end_date', 'r.reason', 'r.status', 'r.decided_by', 'r.decided_at', 'r.decision_remark', 'r.created_at'])
      .where('r.status', '=', status)
      .where(canSee(user))
      .orderBy('r.start_date')
      .execute();
  }

  async decide(user: Principal, id: string, approve: boolean, remark: string, now: Date) {
    const req = await this.db.selectFrom('leave_request').selectAll().where('request_id', '=', id).executeTakeFirst();
    if (!req) throw notFound();
    await assertCanSee(this.db, user, req.employee_id);
    if (req.employee_id === user.employeeId) throw forbidden('SELF_APPROVAL', 'You cannot decide your own leave');
    if (req.status !== 'pending') throw conflict('ALREADY_DECIDED', 'This request has already been decided');
    await this.db.transaction().execute(async (trx) => {
      await trx
        .updateTable('leave_request')
        .set({ status: approve ? 'approved' : 'rejected', decided_by: user.employeeId, decided_at: now, decision_remark: remark || null })
        .where('request_id', '=', id)
        .execute();
      if (approve) {
        // Days already marked Absent inside the range become On leave (trail: leave_approved).
        await declareCause(trx, { cause: 'leave_approved', actorId: user.employeeId, reason: remark || 'Leave approved', leaveRequestId: id });
        await trx
          .updateTable('attendance_event')
          .set({ status: 'on_leave', leave_request_id: id })
          .where('employee_id', '=', req.employee_id)
          .where('status', '=', 'absent')
          .where('work_date', '>=', req.start_date)
          .where('work_date', '<=', req.end_date)
          .execute();
      }
      await this.audit.record({ actorId: user.employeeId, action: approve ? 'leave_approved' : 'leave_rejected', entity: 'leave_request', entityId: id, reason: remark || null }, trx);
      await this.notifications.notify({
        recipientId: req.employee_id, type: 'leave_decided', messageKey: approve ? 'notify.leaveApproved' : 'notify.leaveRejected',
        params: { startDate: req.start_date, endDate: req.end_date }, data: { requestId: id },
      }, trx);
    });
    return this.db.selectFrom('leave_request').selectAll().where('request_id', '=', id).executeTakeFirstOrThrow();
  }
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const CreateBody = z.object({ type: z.enum(['leave', 'off_day']).default('leave'), startDate: isoDate, endDate: isoDate, reason: z.string().trim().min(3).max(1000) });
const DecideBody = z.object({ approve: z.boolean(), remark: z.string().trim().max(1000).default('') })
  .refine((b) => b.approve || b.remark.length >= 3, { message: 'A remark is required when rejecting', path: ['remark'] });
const StatusQuery = z.enum(['pending', 'approved', 'rejected', 'cancelled']).default('pending');

@Controller('leave')
export class LeaveController {
  constructor(private readonly leave: LeaveService) {}

  @Post()
  create(@CurrentUser() user: Principal, @Now() now: Date, @Body(new Zod(CreateBody)) b: z.infer<typeof CreateBody>) {
    return this.leave.create(user, b, now);
  }

  @Get('mine')
  mine(@CurrentUser() user: Principal) {
    return this.leave.mine(user);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@CurrentUser() user: Principal, @Now() now: Date, @Param('id', ParseUUIDPipe) id: string) {
    return this.leave.cancel(user, id, now);
  }

  @Get()
  @Roles(...ADMIN)
  list(@CurrentUser() user: Principal, @Query('status') status?: string) {
    return this.leave.list(user, StatusQuery.parse(status));
  }

  @Post(':id/decide')
  @HttpCode(200)
  @Roles(...ADMIN)
  decide(@CurrentUser() user: Principal, @Now() now: Date, @Param('id', ParseUUIDPipe) id: string, @Body(new Zod(DecideBody)) b: z.infer<typeof DecideBody>) {
    return this.leave.decide(user, id, b.approve, b.remark, now);
  }
}

@Module({ imports: [NotificationsModule], controllers: [LeaveController], providers: [LeaveService], exports: [LeaveService] })
export class LeaveModule {}
