import { Module } from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { AnnouncementController } from './announcement.controller';
import { SmsService } from '../../common/services/sms.service';

@Module({
  controllers: [AnnouncementController],
  providers: [AnnouncementService, SmsService],
  exports: [AnnouncementService],
})
export class AnnouncementModule {}
