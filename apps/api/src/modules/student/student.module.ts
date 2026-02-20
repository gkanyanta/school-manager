import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { AuditService } from '../../common/services/audit.service';
import { StorageService } from '../../common/services/storage.service';

@Module({
  controllers: [StudentController],
  providers: [StudentService, AuditService, StorageService],
  exports: [StudentService],
})
export class StudentModule {}
