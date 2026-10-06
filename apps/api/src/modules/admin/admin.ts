import { Body, Controller, Get, Inject, Injectable, Module, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { hash } from '@node-rs/argon2';
import { sql } from 'kysely';
import { z } from 'zod';
import { ADMIN, CurrentUser, type Principal, Roles } from '../../common/auth/principal';
import { Now } from '../../common/clock';
import { randomToken } from '../../common/crypto';
import { badRequest, conflict, notFound } from '../../common/errors';
import { assertStrongPassword } from '../../common/password';
import { canSee, assertCanSee } from '../../common/scope';
import { AuditService } from '../../common/services';
import { Zod } from '../../common/validation';
import { type Db, KYSELY } from '../../db/database';
import { NotificationService, NotificationsModule } from '../notifications/notifications';
import { assertNotDemoProtected } from '../../common/demo';
import { CONFIG, type Config } from '../../config';

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const name = z.string().trim().min(1).max(120);

const EmployeeCreate = z.object({
  employeeId: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9-]{1,31}$/),
  nameEn: name, nameAr: name,
  email: z.email().optional(),
  mobile: z.string().regex(/^\+[1-9]\d{7,14}$/).optional(),
  branchId: z.uuid(),
  teamId: z.uuid().nullable().optional(),
  shiftStart: time.default('09:00'),
  latestStart: time.default('12:00'),
  weeklyOffDays: z.array(z.number().int().min(1).max(7)).default([5, 6]),
});
/** Accounts are created only here, by the administrator (no self-signup); every new account is a sales rep. */
const EmployeeCreateBody = EmployeeCreate.extend({
  password: z.string().max(256).optional(), // admin-chosen; generated when omitted
  mustChangePassword: z.boolean().default(true),
});
const EmployeeUpdate = EmployeeCreate.omit({ employeeId: true }).partial().extend({ status: z.enum(['active', 'inactive']).optional() });

const lngLat = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);
const GeofenceBody = z.discriminatedUnion('type', [
  z.object({ type: z.literal('circle'), nameEn: name, nameAr: name, center: lngLat, radiusM: z.number().int().min(10).max(5000) }),
  z.object({ type: z.literal('polygon'), nameEn: name, nameAr: name, ring: z.array(lngLat).min(3).max(500) }),
]);
const AssignBody = z.object({ employeeId: z.string().optional(), teamId: z.uuid().optional(), branchId: z.uuid().optional(), validFrom: isoDate.optional() })
  .refine((b) => [b.employeeId, b.teamId, b.branchId].filter(Boolean).length === 1, { message: 'Assign to exactly one employee, team or branch' });
const ConfigBody = z.object({
  scope: z.enum(['global', 'team']),
  teamId: z.uuid().optional(),
  requiredWorkMinutes: z.number().int().min(60).max(720),
  graceMinutes: z.number().int().min(0).max(240),
  pingIntervalSeconds: z.number().int().min(120).max(300),
  outsideGeofenceAction: z.enum(['block', 'flag']),
  photoRequired: z.boolean().default(false),
  shiftTimeoutHours: z.number().int().min(8).max(16).default(12),
  effectiveFrom: isoDate,
}).refine((b) => (b.scope === 'team') === !!b.teamId, { message: 'teamId is required for team scope only', path: ['teamId'] });
const ProductBody = z.object({
  itemType: z.enum(['product', 'offer', 'promo']).default('product'),
  categoryId: z.uuid().nullable().optional(),
  nameEn: name, nameAr: name,
  descriptionEn: z.string().max(4000).default(''),
  descriptionAr: z.string().max(4000).default(''),
  validFrom: isoDate.nullable().optional(),
  validTo: isoDate.nullable().optional(),
});
const ProductStatus = z.object({ status: z.enum(['draft', 'published', 'archived']) });

@Injectable()
export class AdminService {
  constructor(
    @Inject(KYSELY) private readonly db: Db,
    @Inject(CONFIG) private readonly config: Config,
    private readonly audit: AuditService,
    private readonly notifications: NotificationService,
  ) {}

  // ── Dashboard (FR-DSH-02) ──────────────────────────────────────────────────────────────────
  async dashboard(user: Principal, now: Date, teamId?: string) {
    const { rows: [k] } = await sql<Record<string, number>>`
      WITH reps AS (
        SELECT e.employee_id, e.branch_id, e.weekly_off_days, (${now}::timestamptz AT TIME ZONE b.timezone)::date AS d
        FROM employee e JOIN branch b ON b.branch_id = e.branch_id
        WHERE e.role = 'sales_rep' AND e.status = 'active' AND ${canSee(user)} ${teamId ? sql`AND e.team_id = ${teamId}` : sql``}),
      today AS (
        SELECT r.*, ev.status, ev.check_in_at, ev.check_out_at,
               NOT (extract(isodow FROM r.d)::int = ANY (r.weekly_off_days))
               AND NOT EXISTS (SELECT 1 FROM holiday h WHERE h.date = r.d AND (h.branch_id IS NULL OR h.branch_id = r.branch_id)) AS working,
               EXISTS (SELECT 1 FROM leave_request l WHERE l.employee_id = r.employee_id AND l.status = 'approved' AND r.d BETWEEN l.start_date AND l.end_date) AS on_leave,
               -- An open shift counts as on duty even if it started yesterday (late/overnight shifts).
               EXISTS (SELECT 1 FROM attendance_event o WHERE o.employee_id = r.employee_id AND o.check_in_at IS NOT NULL AND o.check_out_at IS NULL) AS on_duty
        FROM reps r LEFT JOIN attendance_event ev ON ev.employee_id = r.employee_id AND ev.work_date = r.d)
      SELECT count(*)::int AS "scheduled",
             count(*) FILTER (WHERE on_duty)::int AS "onDuty",
             count(*) FILTER (WHERE working AND NOT on_leave AND NOT on_duty AND check_in_at IS NULL AND coalesce(status::text, '') <> 'on_leave')::int AS "notCheckedIn",
             count(*) FILTER (WHERE status = 'late')::int AS "late",
             count(*) FILTER (WHERE status = 'suspected_fake')::int AS "suspected",
             count(*) FILTER (WHERE on_leave OR status = 'on_leave')::int AS "onLeave"
      FROM today`.execute(this.db);
    const pending = async (table: 'leave_request' | 'attendance_correction_request') =>
      Number((await this.db.selectFrom(`${table} as r` as 'leave_request as r').innerJoin('employee as e', 'e.employee_id', 'r.employee_id').select((eb) => eb.fn.countAll<number>().as('n')).where('r.status', '=', 'pending').where(canSee(user)).executeTakeFirstOrThrow()).n);
    const { rows: [s] } = await sql<{ n: number }>`
      SELECT count(*)::int AS n FROM attendance_event ev JOIN employee e ON e.employee_id = ev.employee_id
      WHERE ev.status = 'suspected_fake' AND ${canSee(user)}`.execute(this.db);
    return { ...k, pendingReviews: s?.n ?? 0, pendingLeave: await pending('leave_request'), pendingCorrections: await pending('attendance_correction_request') };
  }

  // ── Organisation lookups ───────────────────────────────────────────────────────────────────
  branches() {
    return this.db.selectFrom('branch').select(['branch_id', 'code', 'name_en', 'name_ar', 'timezone']).where('status', '=', 'active').orderBy('name_en').execute();
  }

  teams() {
    const q = this.db.selectFrom('team as t').innerJoin('branch as b', 'b.branch_id', 't.branch_id')
      .select(['t.team_id', 't.name_en', 't.name_ar', 't.branch_id', 'b.name_en as branch_en', 'b.name_ar as branch_ar'])
      .where('t.status', '=', 'active');
    return q.orderBy('t.name_en').execute();
  }

  // ── Employees (FR-EMP-01) ──────────────────────────────────────────────────────────────────
  employees(user: Principal, f: { q?: string; teamId?: string; role?: string; status?: string }) {
    let q = this.db
      .selectFrom('employee as e')
      .innerJoin('branch as b', 'b.branch_id', 'e.branch_id')
      .leftJoin('team as t', 't.team_id', 'e.team_id')
      .select([
        'e.employee_id', 'e.full_name_en', 'e.full_name_ar', 'e.email', 'e.mobile_e164', 'e.role', 'e.status', 'e.shift_start', 'e.latest_start', 'e.weekly_off_days',
        'e.branch_id', 'b.name_en as branch_en', 'b.name_ar as branch_ar', 'e.team_id', 't.name_en as team_en', 't.name_ar as team_ar',
      ])
      .where(canSee(user));
    if (f.teamId) q = q.where('e.team_id', '=', f.teamId);
    if (f.role) q = q.where('e.role', '=', f.role as 'sales_rep');
    if (f.status) q = q.where('e.status', '=', f.status as 'active');
    if (f.q) {
      const like = `%${f.q.trim()}%`;
      q = q.where((eb) => eb.or([eb('e.employee_id', 'ilike', like), eb('e.full_name_en', 'ilike', like), eb('e.full_name_ar', 'ilike', like), eb('e.email', 'ilike', like)]));
    }
    return q.orderBy('e.full_name_en').execute();
  }

  async createEmployee(user: Principal, b: z.infer<typeof EmployeeCreateBody>) {
    if (b.password !== undefined) assertStrongPassword(b.password);
    const password = b.password ?? `Zona-${randomToken().slice(0, 10)}`;
    await this.db.transaction().execute(async (trx) => {
      const exists = await trx.selectFrom('employee').select('employee_id').where('employee_id', '=', b.employeeId).executeTakeFirst();
      if (exists) throw conflict('EMPLOYEE_EXISTS', 'An employee with this ID already exists');
      await trx.insertInto('employee').values({
        employee_id: b.employeeId, full_name_en: b.nameEn, full_name_ar: b.nameAr, email: b.email ?? null, mobile_e164: b.mobile ?? null,
        role: 'sales_rep', branch_id: b.branchId, team_id: b.teamId ?? null,
        shift_start: b.shiftStart, latest_start: b.latestStart, weekly_off_days: b.weeklyOffDays,
      }).execute();
      // Credentials are set by the administrator; by default the rep picks their own at first sign-in (FR-AUTH-02).
      await trx.insertInto('credential').values({ employee_id: b.employeeId, password_hash: await hash(password), must_change_password: b.mustChangePassword }).execute();
      await trx.insertInto('user_preference').values({ employee_id: b.employeeId }).execute();
      await this.audit.record({ actorId: user.employeeId, action: 'employee_created', entity: 'employee', entityId: b.employeeId, after: { ...b, password: undefined, passwordSetBy: b.password ? 'admin' : 'generated' } }, trx);
    });
    return { employeeId: b.employeeId, temporaryPassword: password, mustChangePassword: b.mustChangePassword };
  }

  async updateEmployee(user: Principal, id: string, b: z.infer<typeof EmployeeUpdate>, now: Date) {
    const before = await this.db.selectFrom('employee').selectAll().where('employee_id', '=', id).executeTakeFirst();
    if (!before) throw notFound();
    if (before.role === 'super_admin' && b.status === 'inactive') throw badRequest('ADMIN_REQUIRED', 'The administrator account cannot be deactivated');
    if (b.status === 'inactive') assertNotDemoProtected(this.config, id);
    const set = {
      full_name_en: b.nameEn, full_name_ar: b.nameAr, email: b.email, mobile_e164: b.mobile, branch_id: b.branchId,
      team_id: b.teamId, shift_start: b.shiftStart, latest_start: b.latestStart, weekly_off_days: b.weeklyOffDays,
      status: b.status, deactivated_at: b.status === undefined ? undefined : b.status === 'inactive' ? now : null,
    };
    const clean = Object.fromEntries(Object.entries(set).filter(([, v]) => v !== undefined));
    await this.db.transaction().execute(async (trx) => {
      await trx.updateTable('employee').set(clean).where('employee_id', '=', id).execute();
      if (b.status === 'inactive') {
        await trx.updateTable('auth_session').set({ revoked_at: now, revoke_reason: 'deactivated' }).where('employee_id', '=', id).where('revoked_at', 'is', null).execute();
      }
      await this.audit.record({ actorId: user.employeeId, action: 'employee_updated', entity: 'employee', entityId: id, before, after: clean }, trx);
    });
    return (await this.employees({ ...user, role: 'super_admin' }, { q: id }))[0];
  }

  // ── Geofences (FR-EMP-02) ──────────────────────────────────────────────────────────────────
  async geofences() {
    const { rows } = await sql<Record<string, unknown>>`
      SELECT g.geofence_id, g.name_en, g.name_ar, g.type, g.radius_m, g.status,
             ST_AsGeoJSON(coalesce(g.center::geometry, g.area::geometry))::json AS geometry,
             coalesce(json_agg(json_build_object(
               'assignmentId', a.assignment_id, 'employeeId', a.employee_id, 'teamId', a.team_id, 'branchId', a.branch_id,
               'label', coalesce(e.full_name_en, t.name_en, b.name_en), 'labelAr', coalesce(e.full_name_ar, t.name_ar, b.name_ar),
               'validFrom', a.valid_from, 'validTo', a.valid_to)) FILTER (WHERE a.assignment_id IS NOT NULL AND (a.valid_to IS NULL OR a.valid_to >= current_date)), '[]') AS assignments
      FROM geofence g
      LEFT JOIN geofence_assignment a ON a.geofence_id = g.geofence_id
      LEFT JOIN employee e ON e.employee_id = a.employee_id
      LEFT JOIN team t ON t.team_id = a.team_id
      LEFT JOIN branch b ON b.branch_id = a.branch_id
      GROUP BY g.geofence_id ORDER BY g.name_en`.execute(this.db);
    return rows;
  }

  async createGeofence(user: Principal, b: z.infer<typeof GeofenceBody>) {
    const wkt = b.type === 'circle'
      ? `SRID=4326;POINT(${b.center[0]} ${b.center[1]})`
      : `SRID=4326;POLYGON((${[...b.ring, b.ring[0]!].map(([x, y]) => `${x} ${y}`).join(', ')}))`;
    const row = await this.db.insertInto('geofence').values({
      name_en: b.nameEn, name_ar: b.nameAr, type: b.type, created_by: user.employeeId,
      ...(b.type === 'circle' ? { center: sql`ST_GeogFromText(${wkt})`, radius_m: b.radiusM } : { area: sql`ST_GeogFromText(${wkt})` }),
    }).returning('geofence_id').executeTakeFirstOrThrow();
    await this.audit.record({ actorId: user.employeeId, action: 'geofence_created', entity: 'geofence', entityId: row.geofence_id, after: b });
    return row;
  }

  async setGeofenceStatus(user: Principal, id: string, status: 'active' | 'inactive') {
    await this.db.updateTable('geofence').set({ status }).where('geofence_id', '=', id).execute();
    await this.audit.record({ actorId: user.employeeId, action: `geofence_${status}`, entity: 'geofence', entityId: id });
    return { geofenceId: id, status };
  }

  async assign(user: Principal, geofenceId: string, b: z.infer<typeof AssignBody>, now: Date) {
    const row = await this.db.insertInto('geofence_assignment').values({
      geofence_id: geofenceId, employee_id: b.employeeId ?? null, team_id: b.teamId ?? null, branch_id: b.branchId ?? null,
      valid_from: b.validFrom ?? now.toISOString().slice(0, 10),
    }).returning('assignment_id').executeTakeFirstOrThrow();
    await this.audit.record({ actorId: user.employeeId, action: 'geofence_assigned', entity: 'geofence', entityId: geofenceId, after: b });
    return row;
  }

  async unassign(user: Principal, assignmentId: string, now: Date) {
    const yesterday = new Date(now.getTime() - 86_400_000).toISOString().slice(0, 10);
    await this.db.updateTable('geofence_assignment').set({ valid_to: sql`greatest(valid_from, ${yesterday}::date)` }).where('assignment_id', '=', assignmentId).execute();
    await this.audit.record({ actorId: user.employeeId, action: 'geofence_unassigned', entity: 'geofence_assignment', entityId: assignmentId });
    return { ended: true };
  }

  // ── Attendance rules (FR-ATM-05, 8-hour rule) ──────────────────────────────────────────────
  configs() {
    return this.db.selectFrom('attendance_config as c').leftJoin('team as t', 't.team_id', 'c.team_id').leftJoin('employee as e', 'e.employee_id', 'c.created_by')
      .select(['c.config_id', 'c.scope', 'c.team_id', 't.name_en as team_en', 't.name_ar as team_ar', 'c.required_work_minutes', 'c.grace_minutes', 'c.ping_interval_seconds',
        'c.outside_geofence_action', 'c.photo_required', 'c.shift_timeout_hours', 'c.effective_from', 'c.created_at', 'e.full_name_en as created_by_en', 'e.full_name_ar as created_by_ar'])
      .orderBy('c.effective_from', 'desc').orderBy('c.created_at', 'desc').execute();
  }

  async addConfig(user: Principal, b: z.infer<typeof ConfigBody>) {
    const row = await this.db.insertInto('attendance_config').values({
      scope: b.scope, team_id: b.teamId ?? null, required_work_minutes: b.requiredWorkMinutes, grace_minutes: b.graceMinutes,
      ping_interval_seconds: b.pingIntervalSeconds, outside_geofence_action: b.outsideGeofenceAction, photo_required: b.photoRequired,
      shift_timeout_hours: b.shiftTimeoutHours, effective_from: b.effectiveFrom, created_by: user.employeeId,
    }).returningAll().executeTakeFirstOrThrow();
    await this.audit.record({ actorId: user.employeeId, action: 'attendance_config_added', entity: 'attendance_config', entityId: row.config_id, after: b });
    return row;
  }

  // ── Marketing CMS (FR-MKM-01, FR-MKT-05) ───────────────────────────────────────────────────
  products(f: { status?: string; q?: string }) {
    let q = this.db.selectFrom('product as p').leftJoin('product_category as c', 'c.category_id', 'p.category_id')
      .select(['p.product_id', 'p.item_type', 'p.category_id', 'c.name_en as category_en', 'c.name_ar as category_ar', 'p.name_en', 'p.name_ar', 'p.description_en', 'p.description_ar',
        'p.valid_from', 'p.valid_to', 'p.status', 'p.share_slug', 'p.published_at', 'p.updated_at',
        (eb) => eb.selectFrom('share_event as s').select((x) => x.fn.countAll<number>().as('n')).whereRef('s.product_id', '=', 'p.product_id').as('shares')]);
    if (f.status) q = q.where('p.status', '=', f.status as 'draft');
    if (f.q) q = q.where((eb) => eb.or([eb('p.name_en', 'ilike', `%${f.q}%`), eb('p.name_ar', 'ilike', `%${f.q}%`)]));
    return q.orderBy('p.updated_at', 'desc').execute();
  }

  async saveProduct(user: Principal, b: z.infer<typeof ProductBody>, id?: string) {
    const values = {
      item_type: b.itemType, category_id: b.categoryId ?? null, name_en: b.nameEn, name_ar: b.nameAr, description_en: b.descriptionEn,
      description_ar: b.descriptionAr, valid_from: b.validFrom ?? null, valid_to: b.validTo ?? null,
    };
    const row = id
      ? await this.db.updateTable('product').set(values).where('product_id', '=', id).returning('product_id').executeTakeFirst()
      : await this.db.insertInto('product').values({ ...values, created_by: user.employeeId }).returning('product_id').executeTakeFirst();
    if (!row) throw notFound();
    await this.audit.record({ actorId: user.employeeId, action: id ? 'product_updated' : 'product_created', entity: 'product', entityId: row.product_id, after: b });
    return row;
  }

  async setProductStatus(user: Principal, id: string, status: 'draft' | 'published' | 'archived', now: Date) {
    const p = await this.db.selectFrom('product').select(['status', 'name_en', 'name_ar']).where('product_id', '=', id).executeTakeFirst();
    if (!p) throw notFound();
    await this.db.transaction().execute(async (trx) => {
      await trx.updateTable('product').set({ status, ...(status === 'published' ? { published_at: now, published_by: user.employeeId } : {}) }).where('product_id', '=', id).execute();
      if (status === 'published' && p.status !== 'published') {
        // FR-MKT-05: tell every active rep about new content.
        const reps = await trx.selectFrom('employee').select('employee_id').where('role', '=', 'sales_rep').where('status', '=', 'active').execute();
        await this.notifications.notify(reps.map((r) => ({ recipientId: r.employee_id, type: 'new_content' as const, messageKey: 'notify.newContent', params: { nameEn: p.name_en, nameAr: p.name_ar }, data: { productId: id } })), trx);
      }
      await this.audit.record({ actorId: user.employeeId, action: `product_${status}`, entity: 'product', entityId: id, before: { status: p.status }, after: { status } }, trx);
    });
    return { productId: id, status };
  }

  categories() {
    return this.db.selectFrom('product_category').selectAll().orderBy('sort_order').execute();
  }

  /** FR-MKM-02: shares per product / employee / channel over a range. */
  async shareReport(user: Principal, from: string, to: string) {
    const base = this.db.selectFrom('share_event as s').innerJoin('employee as e', 'e.employee_id', 's.employee_id').innerJoin('product as p', 'p.product_id', 's.product_id')
      .where('s.shared_at', '>=', new Date(`${from}T00:00:00+03:00`)).where('s.shared_at', '<', new Date(new Date(`${to}T00:00:00+03:00`).getTime() + 86_400_000)).where(canSee(user));
    const [byProduct, byEmployee, byChannel] = await Promise.all([
      base.select(['p.product_id', 'p.name_en', 'p.name_ar', (eb) => eb.fn.countAll<number>().as('shares')]).groupBy(['p.product_id', 'p.name_en', 'p.name_ar']).orderBy('shares', 'desc').execute(),
      base.select(['e.employee_id', 'e.full_name_en', 'e.full_name_ar', (eb) => eb.fn.countAll<number>().as('shares')]).groupBy(['e.employee_id', 'e.full_name_en', 'e.full_name_ar']).orderBy('shares', 'desc').execute(),
      base.select(['s.channel', (eb) => eb.fn.countAll<number>().as('shares')]).groupBy('s.channel').orderBy('shares', 'desc').execute(),
    ]);
    return { from, to, byProduct, byEmployee, byChannel };
  }
}

@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService, @Inject(KYSELY) private readonly db: Db) {}

  @Get('dashboard') @Roles(...ADMIN)
  dashboard(@CurrentUser() u: Principal, @Now() now: Date, @Query('teamId') teamId?: string) { return this.admin.dashboard(u, now, teamId ? z.uuid().parse(teamId) : undefined); }

  @Get('branches') @Roles(...ADMIN)
  branches() { return this.admin.branches(); }

  @Get('teams') @Roles(...ADMIN)
  teams() { return this.admin.teams(); }

  @Get('employees') @Roles(...ADMIN)
  employees(@CurrentUser() u: Principal, @Query() q: Record<string, string>) { return this.admin.employees(u, q); }

  @Get('employees/:id') @Roles(...ADMIN)
  async employee(@CurrentUser() u: Principal, @Param('id') id: string) {
    await assertCanSee(this.db, u, id);
    const [row] = await this.admin.employees(u, { q: id });
    if (!row) throw notFound();
    return row;
  }

  @Post('employees') @Roles(...ADMIN)
  createEmployee(@CurrentUser() u: Principal, @Body(new Zod(EmployeeCreateBody)) b: z.infer<typeof EmployeeCreateBody>) { return this.admin.createEmployee(u, b); }

  @Patch('employees/:id') @Roles(...ADMIN)
  updateEmployee(@CurrentUser() u: Principal, @Now() now: Date, @Param('id') id: string, @Body(new Zod(EmployeeUpdate)) b: z.infer<typeof EmployeeUpdate>) { return this.admin.updateEmployee(u, id, b, now); }

  @Get('geofences') @Roles(...ADMIN)
  geofences() { return this.admin.geofences(); }

  @Post('geofences') @Roles(...ADMIN)
  createGeofence(@CurrentUser() u: Principal, @Body(new Zod(GeofenceBody)) b: z.infer<typeof GeofenceBody>) { return this.admin.createGeofence(u, b); }

  @Post('geofences/:id/status') @Roles(...ADMIN)
  geofenceStatus(@CurrentUser() u: Principal, @Param('id', ParseUUIDPipe) id: string, @Body(new Zod(z.object({ status: z.enum(['active', 'inactive']) }))) b: { status: 'active' | 'inactive' }) { return this.admin.setGeofenceStatus(u, id, b.status); }

  @Post('geofences/:id/assignments') @Roles(...ADMIN)
  assign(@CurrentUser() u: Principal, @Now() now: Date, @Param('id', ParseUUIDPipe) id: string, @Body(new Zod(AssignBody)) b: z.infer<typeof AssignBody>) { return this.admin.assign(u, id, b, now); }

  @Post('geofence-assignments/:id/end') @Roles(...ADMIN)
  unassign(@CurrentUser() u: Principal, @Now() now: Date, @Param('id', ParseUUIDPipe) id: string) { return this.admin.unassign(u, id, now); }

  @Get('attendance-config') @Roles(...ADMIN)
  configs() { return this.admin.configs(); }

  @Post('attendance-config') @Roles(...ADMIN)
  addConfig(@CurrentUser() u: Principal, @Body(new Zod(ConfigBody)) b: z.infer<typeof ConfigBody>) { return this.admin.addConfig(u, b); }

  @Get('products') @Roles(...ADMIN)
  products(@Query() q: Record<string, string>) { return this.admin.products(q); }

  @Get('categories') @Roles(...ADMIN)
  categories() { return this.admin.categories(); }

  @Post('products') @Roles(...ADMIN)
  createProduct(@CurrentUser() u: Principal, @Body(new Zod(ProductBody)) b: z.infer<typeof ProductBody>) { return this.admin.saveProduct(u, b); }

  @Patch('products/:id') @Roles(...ADMIN)
  updateProduct(@CurrentUser() u: Principal, @Param('id', ParseUUIDPipe) id: string, @Body(new Zod(ProductBody)) b: z.infer<typeof ProductBody>) { return this.admin.saveProduct(u, b, id); }

  @Post('products/:id/status') @Roles(...ADMIN)
  productStatus(@CurrentUser() u: Principal, @Now() now: Date, @Param('id', ParseUUIDPipe) id: string, @Body(new Zod(ProductStatus)) b: z.infer<typeof ProductStatus>) { return this.admin.setProductStatus(u, id, b.status, now); }

  @Get('reports/shares') @Roles(...ADMIN)
  shares(@CurrentUser() u: Principal, @Query('from') from: string, @Query('to') to: string) { return this.admin.shareReport(u, isoDate.parse(from), isoDate.parse(to)); }
}

@Module({ imports: [NotificationsModule], controllers: [AdminController], providers: [AdminService] })
export class AdminModule {}
