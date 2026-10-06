import { Body, Controller, Get, HttpCode, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { ADMIN, CurrentUser, type Principal, Roles } from '../../common/auth/principal';
import { Zod } from '../../common/validation';
import { LocationService } from './location.service';

const PingsBody = z.object({
  pings: z.array(z.object({
    pingId: z.uuid(),
    recordedAt: z.coerce.date(),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    accuracyM: z.number().min(0).max(10_000).optional(),
    speedMps: z.number().min(0).max(200).optional(),
    headingDeg: z.number().min(0).lt(360).optional(),
    provider: z.enum(['gps', 'network', 'fused']).optional(),
    isMock: z.boolean().optional(),
  })).min(1).max(500),
});
const TrailQuery = z.object({ employeeId: z.string().min(2).max(32), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

@Controller('location')
export class LocationController {
  constructor(private readonly location: LocationService) {}

  @Post('pings')
  @HttpCode(200)
  @Roles('sales_rep')
  ingest(@CurrentUser() user: Principal, @Body(new Zod(PingsBody)) b: z.infer<typeof PingsBody>) {
    return this.location.ingest(user, b.pings);
  }

  @Get('live')
  @Roles(...ADMIN)
  live(@CurrentUser() user: Principal) {
    return this.location.live(user);
  }

  /** Server-Sent Events: a snapshot, then one event per changed rep within the viewer's scope. */
  @Get('live/stream')
  @Roles(...ADMIN)
  async stream(@CurrentUser() user: Principal, @Req() req: Request, @Res() res: Response) {
    await this.location.ensureListening();
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.flushHeaders();
    const send = (event: string, data: unknown) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    send('snapshot', await this.location.live(user));
    const sub = this.location.changes.subscribe(async (employeeId) => {
      try {
        const [row] = await this.location.live(user, employeeId);
        // Not in the live table any more (checked out) or out of scope → tell the client to drop it if shown.
        send(row ? 'update' : 'remove', row ?? { employee_id: employeeId });
      } catch {
        /* connection closing */
      }
    });
    const heartbeat = setInterval(() => res.write(': keep-alive\n\n'), 25_000);
    req.on('close', () => {
      clearInterval(heartbeat);
      sub.unsubscribe();
    });
  }

  @Get('trail')
  @Roles(...ADMIN)
  trail(@CurrentUser() user: Principal, @Query(new Zod(TrailQuery)) q: z.infer<typeof TrailQuery>) {
    return this.location.trail(user, q.employeeId, q.date);
  }
}
