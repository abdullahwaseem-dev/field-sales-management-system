import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';

@Module({ imports: [NotificationsModule], controllers: [LocationController], providers: [LocationService], exports: [LocationService] })
export class LocationModule {}
