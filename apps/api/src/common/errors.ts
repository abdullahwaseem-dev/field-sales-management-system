import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { ZodError } from 'zod';

/**
 * Application error with a stable machine code. Clients map `code` to a localized message, so
 * `detail` is for developers/logs only.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly extra: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

export const badRequest = (code: string, msg: string, extra?: Record<string, unknown>) => new ApiError(400, code, msg, extra);
export const unauthorized = (code = 'UNAUTHORIZED', msg = 'Authentication required') => new ApiError(401, code, msg);
export const forbidden = (code = 'FORBIDDEN', msg = 'Not allowed') => new ApiError(403, code, msg);
export const notFound = (code = 'NOT_FOUND', msg = 'Not found') => new ApiError(404, code, msg);
export const conflict = (code: string, msg: string, extra?: Record<string, unknown>) => new ApiError(409, code, msg, extra);
export const unprocessable = (code: string, msg: string, extra?: Record<string, unknown>) => new ApiError(422, code, msg, extra);

/** RFC 7807 problem+json for every error; database rule violations map to 409/422, never 500. */
@Catch()
export class ProblemFilter implements ExceptionFilter {
  private readonly log = new Logger('Error');

  catch(err: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const problem = this.toProblem(err);
    if (problem.status >= 500) this.log.error(err instanceof Error ? err.stack : String(err));
    res.status(problem.status).type('application/problem+json').json(problem);
  }

  private toProblem(err: unknown): { status: number; code: string; title: string; detail?: string; [k: string]: unknown } {
    if (err instanceof ApiError) return { status: err.status, code: err.code, title: err.message, ...err.extra };
    if (err instanceof ZodError) {
      return {
        status: 400,
        code: 'VALIDATION_FAILED',
        title: 'Request validation failed',
        errors: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      };
    }
    if (err instanceof HttpException) {
      const status = err.getStatus();
      return { status, code: status === 429 ? 'RATE_LIMITED' : `HTTP_${status}`, title: err.message };
    }
    const pgErr = err as { code?: string; message?: string; constraint?: string };
    if (pgErr?.code === 'P0001') return { status: 409, code: 'RULE_VIOLATION', title: pgErr.message ?? 'Rule violation' };
    if (pgErr?.code === '23505') return { status: 409, code: 'DUPLICATE', title: 'Already exists', constraint: pgErr.constraint };
    if (pgErr?.code === '23P01') return { status: 409, code: 'OVERLAP', title: 'Overlaps an existing record', constraint: pgErr.constraint };
    if (pgErr?.code === '23514' || pgErr?.code === '23503') {
      return { status: 422, code: 'CONSTRAINT', title: 'Violates a data rule', constraint: pgErr.constraint };
    }
    return { status: 500, code: 'INTERNAL', title: 'Something went wrong' };
  }
}
