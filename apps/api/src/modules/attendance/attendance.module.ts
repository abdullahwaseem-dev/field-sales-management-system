import { Module } from '@nestjs/common';
import { ConsentModule } from '../consent/consent';
import { NotificationsModule } from '../notifications/notifications';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

@Module({
  imports: [ConsentModule, NotificationsModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
