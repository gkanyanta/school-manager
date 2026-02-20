import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { AuditService } from '../../common/services/audit.service';

@Module({
  controllers: [AttendanceController],
  providers: [AttendanceService, AuditService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
