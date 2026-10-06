import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { ADMIN, CurrentUser, type Principal, Roles } from '../../common/auth/principal';
import { Now } from '../../common/clock';
import { Zod } from '../../common/validation';
import { AttendanceService } from './attendance.service';

const lat = z.number().min(-90).max(90);
const lng = z.number().min(-180).max(180);
const fix = z.object({
  lat, lng,
  accuracyM: z.number().min(0).max(10_000).optional(),
  provider: z.enum(['gps', 'network', 'fused']).optional(),
  isMock: z.boolean().optional(),
});
const CheckInBody = z.object({
  location: fix,
  networkLocation: z.object({ lat, lng, accuracyM: z.number().min(0).optional() }).optional(),
  integrity: z.object({ rooted: z.boolean().optional(), emulator: z.boolean().optional(), developerMockSetting: z.boolean().optional() }).optional(),
});
const CheckOutBody = z.object({ location: fix.optional(), confirmShort: z.boolean().optional() });
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const CorrectionBody = z.object({
  workDate: isoDate,
  requestedCheckInAt: z.coerce.date().optional(),
  requestedCheckOutAt: z.coerce.date().optional(),
  reason: z.string().trim().min(3).max(1000),
}).refine((b) => b.requestedCheckInAt || b.requestedCheckOutAt, { message: 'Give a check-in or check-out time' });
const ReviewBody = z.object({ decision: z.enum(['confirm', 'clear']), remark: z.string().trim().min(5).max(2000) });
const DecideBody = z.object({ approve: z.boolean(), remark: z.string().trim().max(2000).default('') })
  .refine((b) => b.approve || b.remark.length >= 3, { message: 'A remark is required when rejecting', path: ['remark'] });
const MonthQuery = z.object({ month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/) });
const RegisterQuery = z.object({
  date: isoDate,
  teamId: z.uuid().optional(),
  status: z.enum(['present', 'late', 'absent', 'suspected_fake', 'confirmed_fake', 'on_leave', 'not_checked_in']).optional(),
  q: z.string().max(100).optional(),
});

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Get('today')
  today(@CurrentUser() user: Principal, @Now() now: Date) {
    return this.attendance.today(user, now);
  }

  @Post('check-in')
  @HttpCode(200)
  @Roles('sales_rep')
  checkIn(@CurrentUser() user: Principal, @Now() now: Date, @Body(new Zod(CheckInBody)) b: z.infer<typeof CheckInBody>) {
    return this.attendance.checkIn(user, b, now);
  }

  @Post('check-out')
  @HttpCode(200)
  @Roles('sales_rep')
  checkOut(@CurrentUser() user: Principal, @Now() now: Date, @Body(new Zod(CheckOutBody)) b: z.infer<typeof CheckOutBody>) {
    return this.attendance.checkOut(user, b, now);
  }

  @Get('me')
  myMonth(@CurrentUser() user: Principal, @Query(new Zod(MonthQuery)) q: z.infer<typeof MonthQuery>) {
    return this.attendance.myMonth(user, q.month);
  }

  @Post('corrections')
  requestCorrection(@CurrentUser() user: Principal, @Body(new Zod(CorrectionBody)) b: z.infer<typeof CorrectionBody>) {
    return this.attendance.requestCorrection(user, b);
  }

  // ── Managers ────────────────────────────────────────────────────────────────────────────────

  @Get('register')
  @Roles(...ADMIN)
  register(@CurrentUser() user: Principal, @Query(new Zod(RegisterQuery)) q: z.infer<typeof RegisterQuery>) {
    return this.attendance.register(user, q);
  }

  @Get('suspected')
  @Roles(...ADMIN)
  suspected(@CurrentUser() user: Principal) {
    return this.attendance.suspectedQueue(user);
  }

  @Get('events/:id')
  @Roles(...ADMIN)
  detail(@CurrentUser() user: Principal, @Param('id', ParseUUIDPipe) id: string) {
    return this.attendance.eventDetail(user, id);
  }

  @Post('events/:id/review')
  @HttpCode(200)
  @Roles(...ADMIN)
  review(@CurrentUser() user: Principal, @Now() now: Date, @Param('id', ParseUUIDPipe) id: string, @Body(new Zod(ReviewBody)) b: z.infer<typeof ReviewBody>) {
    return this.attendance.review(user, id, b.decision, b.remark, now);
  }

  @Get('corrections')
  @Roles(...ADMIN)
  corrections(@CurrentUser() user: Principal, @Query('status') status?: string) {
    const s = z.enum(['pending', 'approved', 'rejected', 'cancelled']).default('pending').parse(status);
    return this.attendance.listCorrections(user, s);
  }

  @Post('corrections/:id/decide')
  @HttpCode(200)
  @Roles(...ADMIN)
  decide(@CurrentUser() user: Principal, @Now() now: Date, @Param('id', ParseUUIDPipe) id: string, @Body(new Zod(DecideBody)) b: z.infer<typeof DecideBody>) {
    return this.attendance.decideCorrection(user, id, b.approve, b.remark, now);
  }
}
