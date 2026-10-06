import { Body, Controller, Get, HttpCode, Inject, Injectable, Module, Post } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser, type Principal } from '../../common/auth/principal';
import { ApiError, badRequest } from '../../common/errors';
import { SettingsService } from '../../common/services';
import { Zod } from '../../common/validation';
import { type Db, KYSELY } from '../../db/database';

/** Explicit consent before tracking (SRS §5.6): versioned text, consent logged per employee. */
@Injectable()
export class ConsentService {
  constructor(@Inject(KYSELY) private readonly db: Db, private readonly settings: SettingsService) {}

  currentVersion() {
    return this.settings.get<string>('consent.current_version', '');
  }

  async status(employeeId: string) {
    const version = await this.currentVersion();
    const row = await this.db
      .selectFrom('tracking_consent')
      .select(['granted_at'])
      .where('employee_id', '=', employeeId)
      .where('consent_version', '=', version)
      .where('revoked_at', 'is', null)
      .executeTakeFirst();
    return { version, accepted: !!row, acceptedAt: row?.granted_at ?? null };
  }

  async assertAccepted(employeeId: string) {
    const s = await this.status(employeeId);
    if (!s.accepted) throw new ApiError(412, 'CONSENT_REQUIRED', 'Location consent is required before checking in', { version: s.version });
  }

  async document() {
    const version = await this.currentVersion();
    const doc = await this.db.selectFrom('consent_document').selectAll().where('version', '=', version).executeTakeFirst();
    if (!doc) throw new ApiError(500, 'CONSENT_MISSING', 'No consent text is published');
    return { version: doc.version, bodyEn: doc.body_en, bodyAr: doc.body_ar };
  }

  async accept(employeeId: string, version: string, deviceId: string | null, appVersion?: string) {
    if (version !== (await this.currentVersion())) throw badRequest('CONSENT_OUTDATED', 'Please review the latest consent text');
    await this.db
      .insertInto('tracking_consent')
      .values({ employee_id: employeeId, consent_version: version, device_id: deviceId, app_version: appVersion ?? null })
      .onConflict((oc) => oc.columns(['employee_id', 'consent_version']).where('revoked_at', 'is', null).doNothing())
      .execute();
    return this.status(employeeId);
  }
}

const AcceptBody = z.object({ version: z.string().min(1).max(40), appVersion: z.string().max(50).optional() });

@Controller('consent')
export class ConsentController {
  constructor(private readonly consent: ConsentService) {}

  @Get()
  async current(@CurrentUser() user: Principal) {
    return { ...(await this.consent.document()), ...(await this.consent.status(user.employeeId)) };
  }

  @Post('accept')
  @HttpCode(200)
  accept(@CurrentUser() user: Principal, @Body(new Zod(AcceptBody)) b: z.infer<typeof AcceptBody>) {
    return this.consent.accept(user.employeeId, b.version, user.deviceId, b.appVersion);
  }
}

@Module({ controllers: [ConsentController], providers: [ConsentService], exports: [ConsentService] })
export class ConsentModule {}
