import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';
import { StudentService } from './student.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StorageService } from '../../common/services/storage.service';
import { Role, StudentStatus } from '@prisma/client';

@ApiTags('Students')
@ApiBearerAuth()
@Controller('students')
export class StudentController {
  constructor(
    private studentService: StudentService,
    private storageService: StorageService,
  ) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.HEAD_TEACHER)
  @ApiOperation({ summary: 'Create a student' })
  async create(@Body() dto: any, @CurrentUser() user: any) {
    const student = await this.studentService.create(dto, user.schoolId, user.id);
    return { success: true, data: student };
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.HEAD_TEACHER, Role.TEACHER, Role.BURSAR)
  @ApiOperation({ summary: 'List students' })
  async findAll(
    @CurrentUser('schoolId') schoolId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('classId') classId?: string,
    @Query('status') status?: StudentStatus,
  ) {
    const result = await this.studentService.findAll(
      schoolId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      search,
      classId,
      status,
    );
    return { success: true, ...result };
  }

  @Get('my-children')
  @Roles(Role.PARENT)
  @ApiOperation({ summary: 'Get my children (parent view)' })
  async myChildren(@CurrentUser() user: any) {
    const students = await this.studentService.findByGuardianUserId(user.id, user.schoolId);
    return { success: true, data: students };
  }

  @Get('export')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.HEAD_TEACHER)
  @ApiOperation({ summary: 'Export students CSV' })
  async exportCsv(
    @CurrentUser('schoolId') schoolId: string,
    @Query('classId') classId: string | undefined,
    @Res() res: Response,
  ) {
    const rows = await this.studentService.exportCsv(schoolId, classId);
    const csv = stringify(rows, { header: true });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students.csv');
    res.send(csv);
  }

  @Post('import')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Import students from CSV' })
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    const records = parse(file.buffer, { columns: true, skip_empty_lines: true });
    const results = { imported: 0, errors: [] as string[] };

    for (const row of records) {
      try {
        await this.studentService.create(
          {
            firstName: row.firstName,
            lastName: row.lastName,
            middleName: row.middleName,
            dateOfBirth: row.dateOfBirth,
            gender: row.gender,
            admissionNumber: row.admissionNumber,
            admissionDate: row.admissionDate || new Date().toISOString(),
            classId: row.classId,
            address: row.address,
          },
          user.schoolId,
          user.id,
        );
        results.imported++;
      } catch (err: any) {
        results.errors.push(`Row ${row.admissionNumber}: ${err.message}`);
      }
    }

    return { success: true, data: results };
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.HEAD_TEACHER, Role.TEACHER, Role.BURSAR)
  @ApiOperation({ summary: 'Get student by ID' })
  async findById(@Param('id') id: string, @CurrentUser('schoolId') schoolId: string) {
    const student = await this.studentService.findById(id, schoolId);
    return { success: true, data: student };
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.HEAD_TEACHER)
  @ApiOperation({ summary: 'Update student' })
  async update(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    const student = await this.studentService.update(id, user.schoolId, dto, user.id);
    return { success: true, data: student };
  }

  @Post(':id/documents')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Upload student document' })
  async uploadDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    await this.studentService.findById(id, user.schoolId);
    const stored = await this.storageService.save(file);

    const doc = await (this as any).prisma?.document.create({
      data: {
        name: file.originalname,
        path: stored.path,
        mimeType: stored.mimeType,
        size: stored.size,
        studentId: id,
      },
    });

    return { success: true, data: doc || stored };
  }
}
