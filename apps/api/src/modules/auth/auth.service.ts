import { Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from '@node-rs/argon2';
import { CONFIG, type Config } from '../../config';
import type { AccessClaims, Principal, Role } from '../../common/auth/principal';
import { randomToken, sha256, sixDigitCode, safeEqual } from '../../common/crypto';
import { ApiError, badRequest, forbidden, unauthorized } from '../../common/errors';
import { AuditService, SettingsService } from '../../common/services';
import { type Db, KYSELY, type Tx } from '../../db/database';
import { assertStrongPassword } from '../../common/password';
import { assertNotDemoProtected, DEMO, isDemoProtected } from '../../common/demo';

export interface DeviceInfo {
  installId: string;
  platform: 'android' | 'ios';
  model?: string;
  osVersion?: string;
  appVersion?: string;
  pushToken?: string;
  integrity?: Record<string, unknown>;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  mustChangePassword: boolean;
  employee: { employeeId: string; role: Role; nameEn: string; nameAr: string };
}

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
const MOBILE_ROLES: Role[] = ['sales_rep'];
const PORTAL_ROLES: Role[] = ['super_admin'];
// Verified when the employee ID is unknown, so response time does not reveal which IDs exist.
const DUMMY_HASH = '$argon2id$v=19$m=19456,t=2,p=1$c2ZtcyBkdW1teSBzYWx0$G2YtLCcM0Tt5iTkbD4JrEY5H3cwLzX1f+4edK4T/zmI';

@Injectable()
export class AuthService {
  private readonly log = new Logger('Auth');

  constructor(
    @Inject(KYSELY) private readonly db: Db,
    @Inject(CONFIG) private readonly config: Config,
    private readonly jwt: JwtService,
    private readonly settings: SettingsService,
    private readonly audit: AuditService,
  ) {}

  /** FR-AUTH-01 (password), FR-AUTH-03 (one active mobile device). */
  async loginWithPassword(employeeId: string, password: string, client: 'mobile' | 'portal', device?: DeviceInfo): Promise<TokenPair> {
    const row = await this.db
      .selectFrom('employee as e')
      .innerJoin('credential as c', 'c.employee_id', 'e.employee_id')
      .select(['e.employee_id', 'e.role', 'e.status', 'e.full_name_en', 'e.full_name_ar', 'c.password_hash', 'c.failed_attempts', 'c.locked_until', 'c.must_change_password'])
      .where('e.employee_id', '=', employeeId.trim().toUpperCase())
      .executeTakeFirst();

    if (!row || row.status !== 'active') {
      await verify(DUMMY_HASH, password).catch(() => false);
      throw unauthorized('INVALID_CREDENTIALS', 'Employee ID or password is incorrect');
    }
    if (row.locked_until && row.locked_until > new Date()) {
      throw new ApiError(423, 'ACCOUNT_LOCKED', 'Too many failed attempts', { retryAfterSeconds: Math.ceil((row.locked_until.getTime() - Date.now()) / 1000) });
    }
    if (!(await verify(row.password_hash, password))) {
      if (isDemoProtected(this.config, row.employee_id)) throw unauthorized('INVALID_CREDENTIALS', 'Employee ID or password is incorrect');
      const failed = row.failed_attempts + 1;
      await this.db
        .updateTable('credential')
        .set({ failed_attempts: failed >= MAX_FAILED ? 0 : failed, locked_until: failed >= MAX_FAILED ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null })
        .where('employee_id', '=', row.employee_id)
        .execute();
      throw unauthorized('INVALID_CREDENTIALS', 'Employee ID or password is incorrect');
    }
    await this.db.updateTable('credential').set({ failed_attempts: 0, locked_until: null }).where('employee_id', '=', row.employee_id).execute();
    return this.startSession(row.employee_id, row.role, client, device, row.must_change_password, { en: row.full_name_en, ar: row.full_name_ar });
  }

  /** FR-AUTH-01 (OTP to registered mobile). Always answers the same way, whether or not the ID exists. */
  /** Whether a one-time code can actually reach anyone (no SMS gateway yet → only the dev echo). */
  /** Public demo sign-ins (null outside the demo deployment). */
  get demo() {
    return this.config.DEMO_MODE ? { adminId: DEMO.adminId, repIds: DEMO.visitorRepIds, password: DEMO.password, ownerUrl: DEMO.ownerUrl, repoUrl: DEMO.repoUrl } : null;
  }

  get otpAvailable() {
    return this.config.OTP_DEV_ECHO;
  }

  async requestOtp(employeeId: string, purpose: 'login' | 'password_reset'): Promise<{ sent: true; devCode?: string }> {
    if (!this.otpAvailable) throw new ApiError(503, 'OTP_UNAVAILABLE', 'One-time codes are not available; ask an administrator to reset your password');
    const emp = await this.db
      .selectFrom('employee')
      .select(['employee_id', 'mobile_e164', 'status'])
      .where('employee_id', '=', employeeId.trim().toUpperCase())
      .executeTakeFirst();
    if (!emp || emp.status !== 'active' || !emp.mobile_e164) return { sent: true };

    const recent = await this.db
      .selectFrom('otp_challenge')
      .select('created_at')
      .where('employee_id', '=', emp.employee_id)
      .where('created_at', '>', new Date(Date.now() - 60_000))
      .executeTakeFirst();
    if (recent) throw new ApiError(429, 'OTP_TOO_SOON', 'Wait a minute before requesting another code');

    const code = sixDigitCode();
    const ttl = await this.settings.get<number>('auth.otp_ttl_seconds', 300);
    await this.db
      .insertInto('otp_challenge')
      .values({ employee_id: emp.employee_id, purpose, code_hash: this.otpHash(emp.employee_id, code), expires_at: new Date(Date.now() + ttl * 1000) })
      .execute();
    // SMS gateway integration (Unifonic/Taqnyat/…) plugs in here and turns `otpAvailable` on.
    if (this.config.OTP_DEV_ECHO) {
      this.log.warn(`[dev] OTP for ${emp.employee_id}: ${code}`);
      return { sent: true, devCode: code };
    }
    return { sent: true };
  }

  async loginWithOtp(employeeId: string, code: string, client: 'mobile' | 'portal', device?: DeviceInfo): Promise<TokenPair> {
    const emp = await this.consumeOtp(employeeId, code, 'login');
    return this.startSession(emp.employee_id, emp.role, client, device, emp.must_change_password, { en: emp.full_name_en, ar: emp.full_name_ar });
  }

  async resetPasswordWithOtp(employeeId: string, code: string, newPassword: string) {
    const emp = await this.consumeOtp(employeeId, code, 'password_reset');
    await this.setPassword(emp.employee_id, newPassword, null);
    return { reset: true };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const s = await this.db
      .selectFrom('auth_session as s')
      .innerJoin('employee as e', 'e.employee_id', 's.employee_id')
      .innerJoin('credential as c', 'c.employee_id', 's.employee_id')
      .select(['s.session_id', 's.employee_id', 's.client', 's.device_id', 's.revoked_at', 's.expires_at', 'e.role', 'e.status', 'e.full_name_en', 'e.full_name_ar', 'c.must_change_password'])
      .where('s.refresh_token_hash', '=', sha256(refreshToken))
      .executeTakeFirst();
    if (!s || s.revoked_at || s.expires_at < new Date() || s.status !== 'active') throw unauthorized('SESSION_ENDED', 'Sign in again');
    const next = randomToken(); // rotation: the old refresh token stops working immediately
    await this.db
      .updateTable('auth_session')
      .set({ refresh_token_hash: sha256(next), last_used_at: new Date() })
      .where('session_id', '=', s.session_id)
      .execute();
    return this.tokens(
      { sub: s.employee_id, role: s.role, sid: s.session_id, cli: s.client, dev: s.device_id, mcp: s.must_change_password },
      next, { en: s.full_name_en, ar: s.full_name_ar });
  }

  async logout(user: Principal) {
    await this.db.updateTable('auth_session').set({ revoked_at: new Date(), revoke_reason: 'logout' }).where('session_id', '=', user.sessionId).execute();
  }

  /** FR-AUTH-02: also used for the forced first-login change. */
  async changePassword(user: Principal, currentPassword: string, newPassword: string): Promise<TokenPair> {
    assertNotDemoProtected(this.config, user.employeeId);
    const cred = await this.db.selectFrom('credential').select('password_hash').where('employee_id', '=', user.employeeId).executeTakeFirstOrThrow();
    if (!(await verify(cred.password_hash, currentPassword))) throw unauthorized('INVALID_CREDENTIALS', 'Current password is incorrect');
    if (currentPassword === newPassword) throw badRequest('PASSWORD_REUSED', 'Choose a different password');
    await this.setPassword(user.employeeId, newPassword, user.sessionId);
    const emp = await this.db.selectFrom('employee').select(['full_name_en', 'full_name_ar']).where('employee_id', '=', user.employeeId).executeTakeFirstOrThrow();
    const next = randomToken();
    await this.db.updateTable('auth_session').set({ refresh_token_hash: sha256(next) }).where('session_id', '=', user.sessionId).execute();
    return this.tokens({ sub: user.employeeId, role: user.role, sid: user.sessionId, cli: user.client, dev: user.deviceId, mcp: false }, next, { en: emp.full_name_en, ar: emp.full_name_ar });
  }

  // ── internals ──────────────────────────────────────────────────────────────────────────────

  private otpHash(employeeId: string, code: string) {
    return sha256(`${employeeId}:${code}:${this.config.JWT_SECRET}`);
  }

  private async consumeOtp(employeeId: string, code: string, purpose: 'login' | 'password_reset') {
    const id = employeeId.trim().toUpperCase();
    const otp = await this.db
      .selectFrom('otp_challenge')
      .selectAll()
      .where('employee_id', '=', id)
      .where('purpose', '=', purpose)
      .where('consumed_at', 'is', null)
      .orderBy('created_at', 'desc')
      .executeTakeFirst();
    if (!otp || otp.expires_at < new Date() || otp.attempts >= 5) throw unauthorized('OTP_INVALID', 'The code is invalid or has expired');
    if (!safeEqual(otp.code_hash, this.otpHash(id, code))) {
      await this.db.updateTable('otp_challenge').set({ attempts: otp.attempts + 1 }).where('otp_id', '=', otp.otp_id).execute();
      throw unauthorized('OTP_INVALID', 'The code is invalid or has expired');
    }
    await this.db.updateTable('otp_challenge').set({ consumed_at: new Date() }).where('otp_id', '=', otp.otp_id).execute();
    const emp = await this.db
      .selectFrom('employee as e')
      .innerJoin('credential as c', 'c.employee_id', 'e.employee_id')
      .select(['e.employee_id', 'e.role', 'e.status', 'e.full_name_en', 'e.full_name_ar', 'c.must_change_password'])
      .where('e.employee_id', '=', id)
      .executeTakeFirstOrThrow();
    if (emp.status !== 'active') throw unauthorized('INVALID_CREDENTIALS', 'Account is not active');
    return emp;
  }

  private async setPassword(employeeId: string, newPassword: string, keepSessionId: string | null) {
    assertStrongPassword(newPassword);
    await this.db.transaction().execute(async (trx) => {
      await trx
        .updateTable('credential')
        .set({ password_hash: await hash(newPassword), must_change_password: false, password_changed_at: new Date(), failed_attempts: 0, locked_until: null })
        .where('employee_id', '=', employeeId)
        .execute();
      // Sign out every other session after a password change.
      let q = trx.updateTable('auth_session').set({ revoked_at: new Date(), revoke_reason: 'password_changed' }).where('employee_id', '=', employeeId).where('revoked_at', 'is', null);
      if (keepSessionId) q = q.where('session_id', '!=', keepSessionId);
      await q.execute();
      await this.audit.record({ actorId: employeeId, action: 'password_changed', entity: 'credential', entityId: employeeId }, trx);
    });
  }

  private async startSession(employeeId: string, role: Role, client: 'mobile' | 'portal', device: DeviceInfo | undefined, mustChange: boolean, name: { en: string; ar: string }): Promise<TokenPair> {
    if (client === 'portal' && !PORTAL_ROLES.includes(role)) throw forbidden('PORTAL_NOT_ALLOWED', 'Sales representatives use the mobile app');
    if (client === 'mobile' && !MOBILE_ROLES.includes(role)) throw forbidden('MOBILE_NOT_ALLOWED', 'Use the admin portal');
    if (client === 'mobile' && !device) throw badRequest('DEVICE_REQUIRED', 'Mobile sign-in must identify the device');

    const refresh = randomToken();
    const session = await this.db.transaction().execute(async (trx) => {
      const deviceId = client === 'mobile' ? await this.upsertDevice(trx, employeeId, device!) : null;
      if (client === 'mobile') {
        // FR-AUTH-03: keep only the newest N mobile sessions (default 1) — the new device wins.
        const max = await this.settings.get<number>('auth.max_active_mobile_sessions', 1);
        const active = await trx
          .selectFrom('auth_session')
          .select('session_id')
          .where('employee_id', '=', employeeId).where('client', '=', 'mobile').where('revoked_at', 'is', null)
          .orderBy('created_at', 'desc')
          .execute();
        const toRevoke = active.slice(Math.max(0, max - 1)).map((s) => s.session_id);
        if (toRevoke.length) {
          await trx.updateTable('auth_session').set({ revoked_at: new Date(), revoke_reason: 'signed_in_on_another_device' }).where('session_id', 'in', toRevoke).execute();
          await this.audit.record({ actorId: employeeId, action: 'sessions_revoked_new_device', entity: 'auth_session', entityId: employeeId, after: { revoked: toRevoke.length } }, trx);
        }
      }
      return trx
        .insertInto('auth_session')
        .values({
          employee_id: employeeId,
          device_id: deviceId,
          client,
          refresh_token_hash: sha256(refresh),
          expires_at: new Date(Date.now() + this.config.REFRESH_TOKEN_TTL_DAYS * 86_400_000),
        })
        .returning(['session_id', 'device_id'])
        .executeTakeFirstOrThrow();
    });
    return this.tokens({ sub: employeeId, role, sid: session.session_id, cli: client, dev: session.device_id, mcp: mustChange }, refresh, name);
  }

  private async upsertDevice(trx: Tx, employeeId: string, d: DeviceInfo): Promise<string> {
    const row = await trx
      .insertInto('device')
      .values({
        employee_id: employeeId, install_id: d.installId, platform: d.platform, model: d.model ?? null, os_version: d.osVersion ?? null,
        app_version: d.appVersion ?? null, push_token: d.pushToken ?? null, integrity: JSON.stringify(d.integrity ?? {}),
      })
      .onConflict((oc) => oc.columns(['employee_id', 'install_id']).doUpdateSet((eb) => ({
        model: eb.ref('excluded.model'), os_version: eb.ref('excluded.os_version'), app_version: eb.ref('excluded.app_version'),
        push_token: eb.ref('excluded.push_token'), integrity: eb.ref('excluded.integrity'), last_seen_at: new Date(),
      })))
      .returning('device_id')
      .executeTakeFirstOrThrow();
    return row.device_id;
  }

  private async tokens(claims: AccessClaims, refreshToken: string, name: { en: string; ar: string }): Promise<TokenPair> {
    const accessToken = await this.jwt.signAsync(claims, { expiresIn: this.config.ACCESS_TOKEN_TTL_SECONDS });
    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.ACCESS_TOKEN_TTL_SECONDS,
      mustChangePassword: claims.mcp,
      employee: { employeeId: claims.sub, role: claims.role, nameEn: name.en, nameAr: name.ar },
    };
  }
}
