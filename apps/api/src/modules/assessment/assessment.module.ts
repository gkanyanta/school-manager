import { Module } from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { AssessmentController } from './assessment.controller';
import { AuditService } from '../../common/services/audit.service';

@Module({
  controllers: [AssessmentController],
  providers: [AssessmentService, AuditService],
  exports: [AssessmentService],
})
export class AssessmentModule {}
