import { Controller, Get, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthGuard } from './common/auth/auth.guard';
import { Public } from './common/auth/principal';
import { ProblemFilter } from './common/errors';
import { CommonModule } from './common/services';
import { CONFIG, type Config, loadConfig } from './config';
import { DatabaseModule } from './db/database';
import { JobsModule } from './jobs/jobs';
import { AdminModule } from './modules/admin/admin';
import { SummaryModule } from './modules/summary/summary';
import { TilesModule } from './modules/tiles/tiles';
import { OrgModule } from './modules/admin/org';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogueModule } from './modules/catalogue/catalogue';
import { ConsentModule } from './modules/consent/consent';
import { LeaveModule } from './modules/leave/leave';
import { LocationModule } from './modules/location/location.module';
import { MeModule } from './modules/me/me';
import { SalesModule } from './modules/sales/sales';
import { DemoModule } from './modules/demo/demo';
import { NotificationsModule } from './modules/notifications/notifications';

@Controller('health')
class HealthController {
  @Public()
  @Get()
  health() {
    return { status: 'ok' };
  }
}

const config = loadConfig();

@Module({
  imports: [
    { module: class ConfigModule {}, global: true, providers: [{ provide: CONFIG, useValue: config }], exports: [CONFIG] },
    JwtModule.register({ global: true, secret: config.JWT_SECRET, signOptions: { algorithm: 'HS256', issuer: 'sfms' }, verifyOptions: { algorithms: ['HS256'], issuer: 'sfms' } }),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 300 }], skipIf: () => config.NODE_ENV === 'test' }),
    DatabaseModule,
    CommonModule,
    AuthModule,
    MeModule,
    ConsentModule,
    AttendanceModule,
    LocationModule,
    LeaveModule,
    CatalogueModule,
    NotificationsModule,
    SalesModule,
    DemoModule,
    AdminModule,
    OrgModule,
    SummaryModule,
    TilesModule,
    JobsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_FILTER, useClass: ProblemFilter },
  ],
})
export class AppModule {}

export type { Config };
