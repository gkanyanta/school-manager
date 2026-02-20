import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post()
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN, Role.HEAD_TEACHER)
  @ApiOperation({ summary: 'Mark attendance for a class' })
  async markAttendance(@Body() dto: any, @CurrentUser() user: any) {
    const session = await this.attendanceService.markAttendance(
      dto.classId,
      dto.date,
      dto.records,
      user.id,
      user.schoolId,
    );
    return { success: true, data: session };
  }

  @Get('class/:classId')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN, Role.HEAD_TEACHER)
  @ApiOperation({ summary: 'Get attendance sessions for a class' })
  async getByClass(
    @Param('classId') classId: string,
    @CurrentUser('schoolId') schoolId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const sessions = await this.attendanceService.getAttendanceByClass(classId, schoolId, startDate, endDate);
    return { success: true, data: sessions };
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get attendance for a student' })
  async getByStudent(
    @Param('studentId') studentId: string,
    @CurrentUser('schoolId') schoolId: string,
  ) {
    const result = await this.attendanceService.getAttendanceByStudent(studentId, schoolId);
    return { success: true, data: result };
  }

  @Get('summary/:classId')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN, Role.HEAD_TEACHER)
  @ApiOperation({ summary: 'Get attendance summary for a class' })
  async getSummary(
    @Param('classId') classId: string,
    @CurrentUser('schoolId') schoolId: string,
  ) {
    const summaries = await this.attendanceService.getClassAttendanceSummary(classId, schoolId);
    return { success: true, data: summaries };
  }
}
