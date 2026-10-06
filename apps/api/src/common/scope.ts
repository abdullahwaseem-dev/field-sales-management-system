import type { Db } from '../db/database';
import { sql } from 'kysely';
import type { Principal } from './auth/principal';
import { forbidden } from './errors';

/**
 * Who can see whose data: the administrator sees everyone; a sales rep sees only themselves.
 * Returns a SQL boolean over an `employee` row aliased as `alias`.
 */
export function canSee(user: Principal, alias = 'e') {
  if (user.role === 'super_admin') return sql<boolean>`true`;
  return sql<boolean>`${sql.ref(`${alias}.employee_id`)} = ${user.employeeId}`;
}

/** Throws 403 unless `user` may see `employeeId`. */
export async function assertCanSee(_db: Db, user: Principal, employeeId: string) {
  if (user.employeeId === employeeId || user.role === 'super_admin') return;
  throw forbidden('OUT_OF_SCOPE', 'This employee is outside your scope');
}
