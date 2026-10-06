import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Server "now" for the request. Attendance times are always server time (device clocks are not
 * trusted). Only when NODE_ENV=test can the `x-test-now` header pin the time, for deterministic tests.
 */
export const Now = createParamDecorator((_: unknown, ctx: ExecutionContext): Date => {
  const req = ctx.switchToHttp().getRequest<Request>();
  const pinned = process.env.NODE_ENV === 'test' ? req.header('x-test-now') : undefined;
  return pinned ? new Date(pinned) : new Date();
});
