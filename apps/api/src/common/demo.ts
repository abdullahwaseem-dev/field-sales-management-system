import type { Config } from '../config';
import { forbidden } from './errors';

/**
 * Public demo (DEMO_MODE=true only). The demo database is rebuilt nightly; these sign-ins are printed
 * on the demo login screens. Seeded accounts can't have their password changed, be reset, be
 * deactivated or get locked out, so one visitor can't lock every other visitor out.
 */
export const DEMO = {
  password: 'ZonaDemo2026',
  adminId: 'ZN-00001',
  visitorRepIds: ['DEMO-REP1', 'DEMO-REP2', 'DEMO-REP3', 'DEMO-REP4', 'DEMO-REP5'],
  ownerUrl: 'https://abdullah-waseem.vercel.app',
  repoUrl: 'https://github.com/abdullahwaseem-dev/field-sales-management-system',
} as const;

export const isDemoProtected = (config: Config, employeeId: string) => config.DEMO_MODE && /^(ZN-|DEMO-)/i.test(employeeId);

export function assertNotDemoProtected(config: Config, employeeId: string) {
  if (isDemoProtected(config, employeeId)) throw forbidden('DEMO_PROTECTED', 'Demo accounts are shared by every visitor and can’t be changed');
}
