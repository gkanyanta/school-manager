import { Controller, Get, Post, Body, Param, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { stringify } from 'csv-stringify/sync';
import { AssessmentService } from './assessment.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Assessments')
@ApiBearerAuth()
@Controller('assessments')
export class AssessmentController {
  constructor(private assessmentService: AssessmentService) {}

  @Post()
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN, Role.HEAD_TEACHER)
  @ApiOperation({ summary: 'Create assessment' })
  async create(@Body() dto: any, @CurrentUser() user: any) {
    const assessment = await this.assessmentService.createAssessment(dto, user.id, user.schoolId);
    return { success: true, data: assessment };
  }

  @Get()
  @ApiOperation({ summary: 'List assessments' })
  async findAll(
    @CurrentUser('schoolId') schoolId: string,
    @Query('classId') classId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('termId') termId?: string,
  ) {
    const assessments = await this.assessmentService.getAssessments(schoolId, classId, subjectId, termId);
    return { success: true, data: assessments };
  }

  @Post(':id/marks')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN, Role.HEAD_TEACHER)
  @ApiOperation({ summary: 'Enter marks for an assessment' })
  async enterMarks(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    const marks = await this.assessmentService.enterMarks(id, dto.marks, user.id, user.schoolId);
    return { success: true, data: marks };
  }

  @Get(':id/marks')
  @ApiOperation({ summary: 'Get marks for an assessment' })
  async getMarks(@Param('id') id: string, @CurrentUser('schoolId') schoolId: string) {
    const result = await this.assessmentService.getMarks(id, schoolId);
    return { success: true, data: result };
  }

  @Get('results/student/:studentId')
  @ApiOperation({ summary: 'Get student results for a term' })
  async getStudentResults(
    @Param('studentId') studentId: string,
    @Query('termId') termId: string,
    @CurrentUser('schoolId') schoolId: string,
  ) {
    const results = await this.assessmentService.getStudentResults(studentId, termId, schoolId);
    return { success: true, data: results };
  }

  @Get('results/class/:classId')
  @ApiOperation({ summary: 'Get class results for a term' })
  async getClassResults(
    @Param('classId') classId: string,
    @Query('termId') termId: string,
    @CurrentUser('schoolId') schoolId: string,
  ) {
    const results = await this.assessmentService.getClassResults(classId, termId, schoolId);
    return { success: true, data: results };
  }

  @Get('results/class/:classId/export')
  @Roles(Role.SCHOOL_ADMIN, Role.HEAD_TEACHER)
  @ApiOperation({ summary: 'Export class results as CSV' })
  async exportClassResults(
    @Param('classId') classId: string,
    @Query('termId') termId: string,
    @CurrentUser('schoolId') schoolId: string,
    @Res() res: Response,
  ) {
    const results = await this.assessmentService.getClassResults(classId, termId, schoolId);

    const rows = results.map((r) => ({
      admissionNumber: r.student.admissionNumber,
      name: `${r.student.firstName} ${r.student.lastName}`,
      average: r.overall.average,
      grade: r.overall.grade,
      remarks: r.overall.remarks,
    }));

    const csv = stringify(rows, { header: true });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=results.csv');
    res.send(csv);
  }
}
