import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AcademicService } from './academic.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Academic')
@ApiBearerAuth()
@Controller()
export class AcademicController {
  constructor(private academicService: AcademicService) {}

  // ─── GRADES ──────────────────────────────────────

  @Post('grades')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.HEAD_TEACHER)
  @ApiOperation({ summary: 'Create grade' })
  async createGrade(@Body() dto: any, @CurrentUser() user: any) {
    const grade = await this.academicService.createGrade(dto, user.schoolId, user.id);
    return { success: true, data: grade };
  }

  @Get('grades')
  @ApiOperation({ summary: 'List grades' })
  async getGrades(@CurrentUser('schoolId') schoolId: string) {
    const grades = await this.academicService.getGrades(schoolId);
    return { success: true, data: grades };
  }

  @Put('grades/:id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.HEAD_TEACHER)
  @ApiOperation({ summary: 'Update grade' })
  async updateGrade(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    const grade = await this.academicService.updateGrade(id, user.schoolId, dto, user.id);
    return { success: true, data: grade };
  }

  // ─── CLASSES ─────────────────────────────────────

  @Post('classes')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.HEAD_TEACHER)
  @ApiOperation({ summary: 'Create class' })
  async createClass(@Body() dto: any, @CurrentUser() user: any) {
    const cls = await this.academicService.createClass(dto, user.schoolId, user.id);
    return { success: true, data: cls };
  }

  @Get('classes')
  @ApiOperation({ summary: 'List classes' })
  async getClasses(@CurrentUser('schoolId') schoolId: string, @Query('gradeId') gradeId?: string) {
    const classes = await this.academicService.getClasses(schoolId, gradeId);
    return { success: true, data: classes };
  }

  @Get('classes/:id')
  @ApiOperation({ summary: 'Get class details with students and assignments' })
  async getClassById(@Param('id') id: string, @CurrentUser('schoolId') schoolId: string) {
    const cls = await this.academicService.getClassById(id, schoolId);
    return { success: true, data: cls };
  }

  // ─── SUBJECTS ────────────────────────────────────

  @Post('subjects')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.HEAD_TEACHER)
  @ApiOperation({ summary: 'Create subject' })
  async createSubject(@Body() dto: any, @CurrentUser() user: any) {
    const subject = await this.academicService.createSubject(dto, user.schoolId, user.id);
    return { success: true, data: subject };
  }

  @Get('subjects')
  @ApiOperation({ summary: 'List subjects' })
  async getSubjects(@CurrentUser('schoolId') schoolId: string, @Query('gradeId') gradeId?: string) {
    const subjects = await this.academicService.getSubjects(schoolId, gradeId);
    return { success: true, data: subjects };
  }

  // ─── TEACHER ASSIGNMENTS ────────────────────────

  @Post('teacher-assignments')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.HEAD_TEACHER)
  @ApiOperation({ summary: 'Assign teacher to class/subject' })
  async createTeacherAssignment(@Body() dto: any, @CurrentUser() user: any) {
    const assignment = await this.academicService.createTeacherAssignment(dto, user.schoolId, user.id);
    return { success: true, data: assignment };
  }

  @Get('teacher-assignments')
  @ApiOperation({ summary: 'List teacher assignments' })
  async getTeacherAssignments(@CurrentUser('schoolId') schoolId: string, @Query('teacherId') teacherId?: string) {
    const assignments = await this.academicService.getTeacherAssignments(schoolId, teacherId);
    return { success: true, data: assignments };
  }

  @Delete('teacher-assignments/:id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.HEAD_TEACHER)
  @ApiOperation({ summary: 'Remove teacher assignment' })
  async deleteTeacherAssignment(@Param('id') id: string, @CurrentUser() user: any) {
    await this.academicService.deleteTeacherAssignment(id, user.schoolId, user.id);
    return { success: true, message: 'Assignment removed' };
  }

  // ─── ACADEMIC YEARS & TERMS ─────────────────────

  @Post('academic-years')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create academic year' })
  async createAcademicYear(@Body() dto: any, @CurrentUser() user: any) {
    const year = await this.academicService.createAcademicYear(dto, user.schoolId, user.id);
    return { success: true, data: year };
  }

  @Get('academic-years')
  @ApiOperation({ summary: 'List academic years' })
  async getAcademicYears(@CurrentUser('schoolId') schoolId: string) {
    const years = await this.academicService.getAcademicYears(schoolId);
    return { success: true, data: years };
  }

  @Post('terms')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create term' })
  async createTerm(@Body() dto: any, @CurrentUser() user: any) {
    const term = await this.academicService.createTerm(dto, user.schoolId, user.id);
    return { success: true, data: term };
  }

  @Get('terms/current')
  @ApiOperation({ summary: 'Get current term' })
  async getCurrentTerm(@CurrentUser('schoolId') schoolId: string) {
    const term = await this.academicService.getCurrentTerm(schoolId);
    return { success: true, data: term };
  }

  // ─── TIMETABLE ──────────────────────────────────

  @Post('timetable')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.HEAD_TEACHER)
  @ApiOperation({ summary: 'Create timetable entry' })
  async createTimetableEntry(@Body() dto: any, @CurrentUser() user: any) {
    const entry = await this.academicService.createTimetableEntry(dto, user.schoolId, user.id);
    return { success: true, data: entry };
  }

  @Get('timetable/:classId')
  @ApiOperation({ summary: 'Get timetable for a class' })
  async getTimetable(@Param('classId') classId: string, @CurrentUser('schoolId') schoolId: string) {
    const entries = await this.academicService.getTimetable(schoolId, classId);
    return { success: true, data: entries };
  }

  @Delete('timetable/:id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.HEAD_TEACHER)
  @ApiOperation({ summary: 'Delete timetable entry' })
  async deleteTimetableEntry(@Param('id') id: string, @CurrentUser() user: any) {
    await this.academicService.deleteTimetableEntry(id, user.schoolId, user.id);
    return { success: true, message: 'Entry removed' };
  }
}
