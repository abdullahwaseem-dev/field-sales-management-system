import { createParamDecorator, type ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Request } from 'express';

/** Mirrors the database enum. HR/supervisor tiers are retired: a constraint allows only super_admin (one) and sales_rep. */
export type Role = 'super_admin' | 'hr_admin' | 'sales_supervisor' | 'sales_rep';

/** The authenticated caller, attached by AuthGuard. */
export interface Principal {
  employeeId: string;
  role: Role;
  sessionId: string;
  client: 'mobile' | 'portal';
  deviceId: string | null;
  mustChangePassword: boolean;
}

export interface AccessClaims {
  sub: string;
  role: Role;
  sid: string;
  cli: 'mobile' | 'portal';
  dev: string | null;
  mcp: boolean;
}

export const IS_PUBLIC = 'sfms:public';
export const ROLES = 'sfms:roles';
export const ALLOW_PENDING_PASSWORD = 'sfms:allowPendingPassword';

/** No authentication required. */
export const Public = () => SetMetadata(IS_PUBLIC, true);
/** Only these roles may call the route. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES, roles);
/** Reachable while a forced password change is pending (FR-AUTH-02). */
export const AllowPendingPassword = () => SetMetadata(ALLOW_PENDING_PASSWORD, true);

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): Principal => {
  return ctx.switchToHttp().getRequest<Request & { user: Principal }>().user;
});

/** Single-admin model: the one administrator does all portal work and sees everyone. */
export const ADMIN: Role[] = ['super_admin'];
