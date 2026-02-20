import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { stringify } from 'csv-stringify/sync';
import { ReportService } from './report.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportController {
  constructor(private reportService: ReportService) {}

  @Get('enrollment')
  @Roles(Role.SCHOOL_ADMIN, Role.HEAD_TEACHER)
  @ApiOperation({ summary: 'Enrollment report by grade/class' })
  async enrollmentReport(@CurrentUser('schoolId') schoolId: string) {
    const report = await this.reportService.getEnrollmentReport(schoolId);
    return { success: true, data: report };
  }

  @Get('attendance-trends')
  @Roles(Role.SCHOOL_ADMIN, Role.HEAD_TEACHER)
  @ApiOperation({ summary: 'Attendance trends' })
  async attendanceTrends(
    @CurrentUser('schoolId') schoolId: string,
    @Query('classId') classId?: string,
    @Query('days') days?: string,
  ) {
    const report = await this.reportService.getAttendanceTrends(schoolId, classId, days ? parseInt(days) : 30);
    return { success: true, data: report };
  }

  @Get('exam-performance')
  @Roles(Role.SCHOOL_ADMIN, Role.HEAD_TEACHER)
  @ApiOperation({ summary: 'Exam performance summary' })
  async examPerformance(
    @CurrentUser('schoolId') schoolId: string,
    @Query('termId') termId: string,
  ) {
    const report = await this.reportService.getExamPerformanceSummary(schoolId, termId);
    return { success: true, data: report };
  }

  @Get('fee-collection')
  @Roles(Role.SCHOOL_ADMIN, Role.BURSAR, Role.HEAD_TEACHER)
  @ApiOperation({ summary: 'Fee collection summary' })
  async feeCollection(
    @CurrentUser('schoolId') schoolId: string,
    @Query('termId') termId?: string,
  ) {
    const report = await this.reportService.getFeeCollectionSummary(schoolId, termId);
    return { success: true, data: report };
  }

  @Get('fee-collection/export')
  @Roles(Role.SCHOOL_ADMIN, Role.BURSAR)
  @ApiOperation({ summary: 'Export fee collection report as CSV' })
  async exportFeeCollection(
    @CurrentUser('schoolId') schoolId: string,
    @Query('termId') termId: string | undefined,
    @Res() res: Response,
  ) {
    const report = await this.reportService.getFeeCollectionSummary(schoolId, termId);
    const csv = stringify(report.gradeBreakdown, { header: true });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=fee-collection.csv');
    res.send(csv);
  }
}
