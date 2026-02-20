import { Module } from '@nestjs/common';
import { FeesService } from './fees.service';
import { FeesController } from './fees.controller';
import { AuditService } from '../../common/services/audit.service';

@Module({
  controllers: [FeesController],
  providers: [FeesService, AuditService],
  exports: [FeesService],
})
export class FeesModule {}
