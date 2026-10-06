import { Body, Controller, Get, Inject, Module, Patch, Put } from '@nestjs/common';
import { z } from 'zod';
import { AllowPendingPassword, CurrentUser, type Principal } from '../../common/auth/principal';
import { Zod } from '../../common/validation';
import { type Db, KYSELY } from '../../db/database';

const PrefsBody = z.object({
  theme: z.enum(['system', 'light', 'dark']).optional(),
  locale: z.enum(['system', 'en', 'ar']).optional(),
  digits: z.enum(['western', 'arabic_indic']).optional(),
  showHijri: z.boolean().optional(),
});
const PushBody = z.object({ pushToken: z.string().min(10).max(4096) });

/** The signed-in user's profile and per-user display preferences (saved server-side). */
@Controller('me')
export class MeController {
  constructor(@Inject(KYSELY) private readonly db: Db) {}

  @Get()
  @AllowPendingPassword()
  async me(@CurrentUser() user: Principal) {
    const e = await this.db
      .selectFrom('employee as e')
      .innerJoin('branch as b', 'b.branch_id', 'e.branch_id')
      .leftJoin('team as t', 't.team_id', 'e.team_id')
      .leftJoin('user_preference as p', 'p.employee_id', 'e.employee_id')
      .select([
        'e.employee_id', 'e.full_name_en', 'e.full_name_ar', 'e.email', 'e.mobile_e164', 'e.role', 'e.shift_start', 'e.latest_start',
        'b.branch_id', 'b.name_en as branch_en', 'b.name_ar as branch_ar', 'b.timezone',
        't.team_id', 't.name_en as team_en', 't.name_ar as team_ar',
        'p.theme', 'p.locale', 'p.digits', 'p.show_hijri',
      ])
      .where('e.employee_id', '=', user.employeeId)
      .executeTakeFirstOrThrow();
    return {
      employeeId: e.employee_id, nameEn: e.full_name_en, nameAr: e.full_name_ar, email: e.email, mobile: e.mobile_e164, role: e.role,
      shiftStart: e.shift_start, latestStart: e.latest_start,
      branch: { id: e.branch_id, nameEn: e.branch_en, nameAr: e.branch_ar, timezone: e.timezone },
      team: e.team_id ? { id: e.team_id, nameEn: e.team_en, nameAr: e.team_ar } : null,
      preferences: { theme: e.theme ?? 'system', locale: e.locale ?? 'system', digits: e.digits ?? 'western', showHijri: e.show_hijri ?? false },
      mustChangePassword: user.mustChangePassword,
      client: user.client,
    };
  }

  @Patch('preferences')
  @AllowPendingPassword()
  async preferences(@CurrentUser() user: Principal, @Body(new Zod(PrefsBody)) b: z.infer<typeof PrefsBody>) {
    const set = { theme: b.theme, locale: b.locale, digits: b.digits, show_hijri: b.showHijri };
    await this.db
      .insertInto('user_preference')
      .values({ employee_id: user.employeeId, ...Object.fromEntries(Object.entries(set).filter(([, v]) => v !== undefined)) })
      .onConflict((oc) => oc.column('employee_id').doUpdateSet(Object.fromEntries(Object.entries(set).filter(([, v]) => v !== undefined))))
      .execute();
    return this.me(user);
  }

  @Put('push-token')
  async pushToken(@CurrentUser() user: Principal, @Body(new Zod(PushBody)) b: z.infer<typeof PushBody>) {
    if (user.deviceId) await this.db.updateTable('device').set({ push_token: b.pushToken, last_seen_at: new Date() }).where('device_id', '=', user.deviceId).execute();
    return { ok: true };
  }
}

@Module({ controllers: [MeController] })
export class MeModule {}
