import { Module } from '@nestjs/common';
import { AcademicService } from './academic.service';
import { AcademicController } from './academic.controller';
import { AuditService } from '../../common/services/audit.service';

@Module({
  controllers: [AcademicController],
  providers: [AcademicService, AuditService],
  exports: [AcademicService],
})
export class AcademicModule {}
