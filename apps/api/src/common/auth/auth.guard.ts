import { type CanActivate, type ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { type Db, KYSELY } from '../../db/database';
import { forbidden, unauthorized } from '../errors';
import { type AccessClaims, ALLOW_PENDING_PASSWORD, IS_PUBLIC, type Principal, ROLES, type Role } from './principal';

/**
 * Global guard: verifies the Bearer access token, checks the session is still live (so revoking a
 * session — e.g. a second device signing in, FR-AUTH-03 — takes effect immediately), enforces the
 * forced password change and @Roles.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    @Inject(KYSELY) private readonly db: Db,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const targets = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) return true;

    const req = ctx.switchToHttp().getRequest<Request & { user?: Principal }>();
    const header = req.header('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) throw unauthorized();

    let claims: AccessClaims;
    try {
      claims = await this.jwt.verifyAsync<AccessClaims>(token);
    } catch {
      throw unauthorized('TOKEN_INVALID', 'Access token is invalid or expired');
    }

    const session = await this.db
      .selectFrom('auth_session as s')
      .innerJoin('employee as e', 'e.employee_id', 's.employee_id')
      .select(['s.revoked_at', 's.expires_at', 'e.status'])
      .where('s.session_id', '=', claims.sid)
      .executeTakeFirst();
    if (!session || session.revoked_at || session.expires_at < new Date() || session.status !== 'active') {
      throw unauthorized('SESSION_ENDED', 'This session has ended; sign in again');
    }

    const user: Principal = {
      employeeId: claims.sub,
      role: claims.role,
      sessionId: claims.sid,
      client: claims.cli,
      deviceId: claims.dev,
      mustChangePassword: claims.mcp,
    };
    if (user.mustChangePassword && !this.reflector.getAllAndOverride<boolean>(ALLOW_PENDING_PASSWORD, targets)) {
      throw forbidden('PASSWORD_CHANGE_REQUIRED', 'Change your password to continue');
    }
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES, targets);
    if (roles && !roles.includes(user.role)) throw forbidden();
    req.user = user;
    return true;
  }
}
