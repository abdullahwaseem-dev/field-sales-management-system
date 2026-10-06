import { Body, Controller, Delete, Get, HttpCode, Inject, Injectable, Module, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { hash } from '@node-rs/argon2';
import { z } from 'zod';
import { ADMIN, CurrentUser, type Principal, Roles } from '../../common/auth/principal';
import { Now } from '../../common/clock';
import { randomToken } from '../../common/crypto';
import { conflict, notFound } from '../../common/errors';
import { AuditService } from '../../common/services';
import { Zod } from '../../common/validation';
import { type Db, KYSELY } from '../../db/database';
import { assertStrongPassword } from '../../common/password';
import { assertNotDemoProtected } from '../../common/demo';
import { CONFIG, type Config } from '../../config';

const name = z.string().trim().min(1).max(120);
const BranchBody = z.object({ code: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{2,16}$/), nameEn: name, nameAr: name, timezone: z.string().default('Asia/Riyadh'), status: z.enum(['active', 'inactive']).optional() });
const ResetBody = z.object({ password: z.string().max(256).optional(), mustChangePassword: z.boolean().default(true) });
const TeamBody = z.object({ branchId: z.uuid(), nameEn: name, nameAr: name, status: z.enum(['active', 'inactive']).optional() });
const HolidayBody = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), nameEn: name, nameAr: name, kind: z.enum(['public_holiday', 'company_off_day']).default('public_holiday'), branchId: z.uuid().nullable().optional() });

/** Organisation setup for a real deployment: branches, teams, holiday calendar, password resets. */
@Injectable()
export class OrgService {
  constructor(@Inject(KYSELY) private readonly db: Db, @Inject(CONFIG) private readonly config: Config, private readonly audit: AuditService) {}

  allBranches() {
    return this.db.selectFrom('branch').selectAll().orderBy('name_en').execute();
  }

  async saveBranch(user: Principal, b: z.infer<typeof BranchBody>, id?: string) {
    const values = { code: b.code, name_en: b.nameEn, name_ar: b.nameAr, timezone: b.timezone, ...(b.status ? { status: b.status } : {}) };
    const row = id
      ? await this.db.updateTable('branch').set(values).where('branch_id', '=', id).returning('branch_id').executeTakeFirst()
      : await this.db.insertInto('branch').values(values).returning('branch_id').executeTakeFirst();
    if (!row) throw notFound();
    await this.audit.record({ actorId: user.employeeId, action: id ? 'branch_updated' : 'branch_created', entity: 'branch', entityId: row.branch_id, after: b });
    return row;
  }

  allTeams() {
    return this.db.selectFrom('team as t').innerJoin('branch as b', 'b.branch_id', 't.branch_id')
      .select(['t.team_id', 't.name_en', 't.name_ar', 't.status', 't.branch_id', 'b.name_en as branch_en', 'b.name_ar as branch_ar'])
      .orderBy('t.name_en').execute();
  }

  async saveTeam(user: Principal, b: z.infer<typeof TeamBody>, id?: string) {
    const values = { branch_id: b.branchId, name_en: b.nameEn, name_ar: b.nameAr, ...(b.status ? { status: b.status } : {}) };
    const row = id
      ? await this.db.updateTable('team').set(values).where('team_id', '=', id).returning('team_id').executeTakeFirst()
      : await this.db.insertInto('team').values(values).returning('team_id').executeTakeFirst();
    if (!row) throw notFound();
    await this.audit.record({ actorId: user.employeeId, action: id ? 'team_updated' : 'team_created', entity: 'team', entityId: row.team_id, after: b });
    return row;
  }

  holidays() {
    return this.db.selectFrom('holiday as h').leftJoin('branch as b', 'b.branch_id', 'h.branch_id')
      .select(['h.holiday_id', 'h.date', 'h.name_en', 'h.name_ar', 'h.kind', 'h.branch_id', 'b.name_en as branch_en', 'b.name_ar as branch_ar'])
      .orderBy('h.date', 'desc').execute();
  }

  async addHoliday(user: Principal, b: z.infer<typeof HolidayBody>) {
    const row = await this.db.insertInto('holiday').values({ date: b.date, name_en: b.nameEn, name_ar: b.nameAr, kind: b.kind, branch_id: b.branchId ?? null })
      .returning('holiday_id').executeTakeFirstOrThrow();
    await this.audit.record({ actorId: user.employeeId, action: 'holiday_added', entity: 'holiday', entityId: row.holiday_id, after: b });
    return row;
  }

  async removeHoliday(user: Principal, id: string, now: Date) {
    const h = await this.db.selectFrom('holiday').selectAll().where('holiday_id', '=', id).executeTakeFirst();
    if (!h) throw notFound();
    if (h.date < now.toISOString().slice(0, 10)) throw conflict('HOLIDAY_IN_PAST', 'Past holidays affect attendance already recorded; they cannot be removed');
    await this.db.deleteFrom('holiday').where('holiday_id', '=', id).execute();
    await this.audit.record({ actorId: user.employeeId, action: 'holiday_removed', entity: 'holiday', entityId: id, before: h });
    return { removed: true };
  }

  /** Admin-issued temporary password (until an SMS gateway enables self-service reset). Ends all sessions. */
  async resetPassword(user: Principal, employeeId: string, b: z.infer<typeof ResetBody>, now: Date) {
    assertNotDemoProtected(this.config, employeeId);
    if (b.password !== undefined) assertStrongPassword(b.password);
    const temporaryPassword = b.password ?? `Zona-${randomToken().slice(0, 10)}`;
    const res = await this.db.updateTable('credential').set({ password_hash: await hash(temporaryPassword), must_change_password: b.mustChangePassword, failed_attempts: 0, locked_until: null })
      .where('employee_id', '=', employeeId).executeTakeFirst();
    if (!Number(res.numUpdatedRows)) throw notFound();
    await this.db.updateTable('auth_session').set({ revoked_at: now, revoke_reason: 'password_reset_by_admin' }).where('employee_id', '=', employeeId).where('revoked_at', 'is', null).execute();
    await this.audit.record({ actorId: user.employeeId, action: 'password_reset_by_admin', entity: 'credential', entityId: employeeId, after: { passwordSetBy: b.password ? 'admin' : 'generated', mustChangePassword: b.mustChangePassword } });
    return { employeeId, temporaryPassword, mustChangePassword: b.mustChangePassword };
  }
}

@Controller('admin')
export class OrgController {
  constructor(private readonly org: OrgService) {}

  @Get('org/branches') @Roles(...ADMIN) branches() { return this.org.allBranches(); }
  @Post('org/branches') @Roles(...ADMIN) createBranch(@CurrentUser() u: Principal, @Body(new Zod(BranchBody)) b: z.infer<typeof BranchBody>) { return this.org.saveBranch(u, b); }
  @Patch('org/branches/:id') @Roles(...ADMIN) updateBranch(@CurrentUser() u: Principal, @Param('id', ParseUUIDPipe) id: string, @Body(new Zod(BranchBody)) b: z.infer<typeof BranchBody>) { return this.org.saveBranch(u, b, id); }

  @Get('org/teams') @Roles(...ADMIN) teams() { return this.org.allTeams(); }
  @Post('org/teams') @Roles(...ADMIN) createTeam(@CurrentUser() u: Principal, @Body(new Zod(TeamBody)) b: z.infer<typeof TeamBody>) { return this.org.saveTeam(u, b); }
  @Patch('org/teams/:id') @Roles(...ADMIN) updateTeam(@CurrentUser() u: Principal, @Param('id', ParseUUIDPipe) id: string, @Body(new Zod(TeamBody)) b: z.infer<typeof TeamBody>) { return this.org.saveTeam(u, b, id); }

  @Get('holidays') @Roles(...ADMIN) holidays() { return this.org.holidays(); }
  @Post('holidays') @Roles(...ADMIN) addHoliday(@CurrentUser() u: Principal, @Body(new Zod(HolidayBody)) b: z.infer<typeof HolidayBody>) { return this.org.addHoliday(u, b); }
  @Delete('holidays/:id') @HttpCode(200) @Roles(...ADMIN) removeHoliday(@CurrentUser() u: Principal, @Now() now: Date, @Param('id', ParseUUIDPipe) id: string) { return this.org.removeHoliday(u, id, now); }

  @Post('employees/:id/reset-password') @HttpCode(200) @Roles(...ADMIN)
  reset(@CurrentUser() u: Principal, @Now() now: Date, @Param('id') id: string, @Body(new Zod(ResetBody)) b: z.infer<typeof ResetBody>) { return this.org.resetPassword(u, id, b, now); }
}

@Module({ controllers: [OrgController], providers: [OrgService] })
export class OrgModule {}
