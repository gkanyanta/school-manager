import { Module } from '@nestjs/common';
import { SchoolService } from './school.service';
import { SchoolController } from './school.controller';
import { AuditService } from '../../common/services/audit.service';

@Module({
  controllers: [SchoolController],
  providers: [SchoolService, AuditService],
  exports: [SchoolService],
})
export class SchoolModule {}
