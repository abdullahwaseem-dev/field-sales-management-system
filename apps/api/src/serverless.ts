import type { IncomingMessage, ServerResponse } from 'node:http';
import '@nestjs/platform-express'; // static import so the bundler's file tracer includes Nest's HTTP adapter
import { createApp } from './main';

/**
 * Serverless entry (Vercel). The Nest app is created once per instance and reused across
 * invocations; background timers are disabled (JOBS_ENABLED=false) — the database scheduler calls
 * /internal/jobs/* instead.
 */
let handler: Promise<(req: IncomingMessage, res: ServerResponse) => void> | undefined;

export default async function sfms(req: IncomingMessage, res: ServerResponse) {
  handler ??= createApp().then(async (app) => {
    await app.init();
    return app.getHttpAdapter().getInstance();
  });
  (await handler)(req, res);
}
