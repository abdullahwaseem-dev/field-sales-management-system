import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { AllowPendingPassword, CurrentUser, type Principal, Public } from '../../common/auth/principal';
import { Zod } from '../../common/validation';
import { AuthService } from './auth.service';

const employeeId = z.string().trim().min(2).max(32);
const device = z.object({
  installId: z.string().min(8).max(128),
  platform: z.enum(['android', 'ios']),
  model: z.string().max(100).optional(),
  osVersion: z.string().max(50).optional(),
  appVersion: z.string().max(50).optional(),
  pushToken: z.string().max(4096).optional(),
  integrity: z.record(z.string(), z.unknown()).optional(),
});
const client = z.enum(['mobile', 'portal']);

const LoginBody = z.object({ employeeId, password: z.string().min(1).max(256), client, device: device.optional() });
const OtpRequestBody = z.object({ employeeId, purpose: z.enum(['login', 'password_reset']).default('login') });
const OtpVerifyBody = z.object({ employeeId, code: z.string().regex(/^\d{6}$/), client, device: device.optional() });
const ResetBody = z.object({ employeeId, code: z.string().regex(/^\d{6}$/), newPassword: z.string().max(256) });
const RefreshBody = z.object({ refreshToken: z.string().min(20).max(200) });
const ChangePasswordBody = z.object({ currentPassword: z.string().min(1).max(256), newPassword: z.string().max(256) });

@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60_000 } }) // brute-force protection on every auth route
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body(new Zod(LoginBody)) b: z.infer<typeof LoginBody>) {
    return this.auth.loginWithPassword(b.employeeId, b.password, b.client, b.device);
  }

  /** Sign-in methods this deployment can actually deliver (the apps hide the rest). */
  @Public()
  @SkipThrottle() // read-only; every page load asks
  @Get('methods')
  methods() {
    return { password: true, otp: this.auth.otpAvailable, demo: this.auth.demo };
  }

  @Public()
  @Post('otp/request')
  @HttpCode(202)
  requestOtp(@Body(new Zod(OtpRequestBody)) b: z.infer<typeof OtpRequestBody>) {
    return this.auth.requestOtp(b.employeeId, b.purpose);
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(200)
  verifyOtp(@Body(new Zod(OtpVerifyBody)) b: z.infer<typeof OtpVerifyBody>) {
    return this.auth.loginWithOtp(b.employeeId, b.code, b.client, b.device);
  }

  @Public()
  @Post('password/reset')
  @HttpCode(200)
  reset(@Body(new Zod(ResetBody)) b: z.infer<typeof ResetBody>) {
    return this.auth.resetPasswordWithOtp(b.employeeId, b.code, b.newPassword);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  refresh(@Body(new Zod(RefreshBody)) b: z.infer<typeof RefreshBody>) {
    return this.auth.refresh(b.refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  @AllowPendingPassword()
  async logout(@CurrentUser() user: Principal) {
    await this.auth.logout(user);
  }

  @Post('password')
  @HttpCode(200)
  @AllowPendingPassword()
  changePassword(@CurrentUser() user: Principal, @Body(new Zod(ChangePasswordBody)) b: z.infer<typeof ChangePasswordBody>) {
    return this.auth.changePassword(user, b.currentPassword, b.newPassword);
  }
}
