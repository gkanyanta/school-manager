import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { DayOfWeek, TermName } from '@prisma/client';

@Injectable()
export class AcademicService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  // ─── GRADES ──────────────────────────────────────────

  async createGrade(data: { name: string; level: number; description?: string }, schoolId: string, userId: string) {
    const existing = await this.prisma.grade.findFirst({
      where: { OR: [{ name: data.name, schoolId }, { level: data.level, schoolId }] },
    });
    if (existing) throw new BadRequestException('Grade name or level already exists');

    const grade = await this.prisma.grade.create({
      data: { ...data, schoolId },
    });

    await this.auditService.log({ userId, action: 'CREATE_GRADE', entity: 'Grade', entityId: grade.id, schoolId });
    return grade;
  }

  async getGrades(schoolId: string) {
    return this.prisma.grade.findMany({
      where: { schoolId },
      include: { classes: true, subjects: true },
      orderBy: { level: 'asc' },
    });
  }

  async updateGrade(id: string, schoolId: string, data: { name?: string; level?: number; description?: string }, userId: string) {
    const grade = await this.prisma.grade.findFirst({ where: { id, schoolId } });
    if (!grade) throw new NotFoundException('Grade not found');

    const updated = await this.prisma.grade.update({ where: { id }, data });
    await this.auditService.log({ userId, action: 'UPDATE_GRADE', entity: 'Grade', entityId: id, schoolId });
    return updated;
  }

  // ─── CLASSES ─────────────────────────────────────────

  async createClass(data: { name: string; gradeId: string; capacity?: number }, schoolId: string, userId: string) {
    const grade = await this.prisma.grade.findFirst({ where: { id: data.gradeId, schoolId } });
    if (!grade) throw new BadRequestException('Grade not found');

    const cls = await this.prisma.class.create({
      data: { ...data, schoolId },
      include: { grade: true },
    });

    await this.auditService.log({ userId, action: 'CREATE_CLASS', entity: 'Class', entityId: cls.id, schoolId });
    return cls;
  }

  async getClasses(schoolId: string, gradeId?: string) {
    const where: any = { schoolId };
    if (gradeId) where.gradeId = gradeId;

    return this.prisma.class.findMany({
      where,
      include: {
        grade: true,
        _count: { select: { students: true } },
      },
      orderBy: [{ grade: { level: 'asc' } }, { name: 'asc' }],
    });
  }

  async getClassById(id: string, schoolId: string) {
    const cls = await this.prisma.class.findFirst({
      where: { id, schoolId },
      include: {
        grade: true,
        students: { where: { status: 'ACTIVE' }, orderBy: { firstName: 'asc' } },
        teacherAssignments: { include: { teacher: true, subject: true } },
      },
    });
    if (!cls) throw new NotFoundException('Class not found');
    return cls;
  }

  // ─── SUBJECTS ────────────────────────────────────────

  async createSubject(data: { name: string; code: string; gradeId: string; description?: string }, schoolId: string, userId: string) {
    const grade = await this.prisma.grade.findFirst({ where: { id: data.gradeId, schoolId } });
    if (!grade) throw new BadRequestException('Grade not found');

    const subject = await this.prisma.subject.create({
      data: { ...data, schoolId },
      include: { grade: true },
    });

    await this.auditService.log({ userId, action: 'CREATE_SUBJECT', entity: 'Subject', entityId: subject.id, schoolId });
    return subject;
  }

  async getSubjects(schoolId: string, gradeId?: string) {
    const where: any = { schoolId };
    if (gradeId) where.gradeId = gradeId;

    return this.prisma.subject.findMany({
      where,
      include: { grade: true },
      orderBy: { name: 'asc' },
    });
  }

  // ─── TEACHER ASSIGNMENTS ────────────────────────────

  async createTeacherAssignment(
    data: { teacherId: string; classId: string; subjectId: string; isClassTeacher?: boolean },
    schoolId: string,
    userId: string,
  ) {
    const [teacher, cls, subject] = await Promise.all([
      this.prisma.user.findFirst({ where: { id: data.teacherId, schoolId, role: 'TEACHER' } }),
      this.prisma.class.findFirst({ where: { id: data.classId, schoolId } }),
      this.prisma.subject.findFirst({ where: { id: data.subjectId, schoolId } }),
    ]);

    if (!teacher) throw new BadRequestException('Teacher not found');
    if (!cls) throw new BadRequestException('Class not found');
    if (!subject) throw new BadRequestException('Subject not found');

    const assignment = await this.prisma.teacherAssignment.create({
      data: { ...data, isClassTeacher: data.isClassTeacher || false, schoolId },
      include: { teacher: true, class: true, subject: true },
    });

    await this.auditService.log({ userId, action: 'CREATE_TEACHER_ASSIGNMENT', entity: 'TeacherAssignment', entityId: assignment.id, schoolId });
    return assignment;
  }

  async getTeacherAssignments(schoolId: string, teacherId?: string) {
    const where: any = { schoolId };
    if (teacherId) where.teacherId = teacherId;

    return this.prisma.teacherAssignment.findMany({
      where,
      include: { teacher: true, class: { include: { grade: true } }, subject: true },
    });
  }

  async deleteTeacherAssignment(id: string, schoolId: string, userId: string) {
    const assignment = await this.prisma.teacherAssignment.findFirst({ where: { id, schoolId } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    await this.prisma.teacherAssignment.delete({ where: { id } });
    await this.auditService.log({ userId, action: 'DELETE_TEACHER_ASSIGNMENT', entity: 'TeacherAssignment', entityId: id, schoolId });
  }

  // ─── ACADEMIC YEAR & TERMS ──────────────────────────

  async createAcademicYear(data: { name: string; startDate: string | Date; endDate: string | Date; isCurrent?: boolean }, schoolId: string, userId: string) {
    if (data.isCurrent) {
      await this.prisma.academicYear.updateMany({ where: { schoolId, isCurrent: true }, data: { isCurrent: false } });
    }

    const year = await this.prisma.academicYear.create({
      data: {
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isCurrent: data.isCurrent || false,
        schoolId,
      },
    });

    await this.auditService.log({ userId, action: 'CREATE_ACADEMIC_YEAR', entity: 'AcademicYear', entityId: year.id, schoolId });
    return year;
  }

  async getAcademicYears(schoolId: string) {
    return this.prisma.academicYear.findMany({
      where: { schoolId },
      include: { terms: { orderBy: { name: 'asc' } } },
      orderBy: { startDate: 'desc' },
    });
  }

  async createTerm(data: { name: TermName; academicYearId: string; startDate: string | Date; endDate: string | Date; isCurrent?: boolean }, schoolId: string, userId: string) {
    const year = await this.prisma.academicYear.findFirst({ where: { id: data.academicYearId, schoolId } });
    if (!year) throw new BadRequestException('Academic year not found');

    if (data.isCurrent) {
      await this.prisma.term.updateMany({ where: { schoolId, isCurrent: true }, data: { isCurrent: false } });
    }

    const term = await this.prisma.term.create({
      data: {
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isCurrent: data.isCurrent || false,
        academicYearId: data.academicYearId,
        schoolId,
      },
    });

    await this.auditService.log({ userId, action: 'CREATE_TERM', entity: 'Term', entityId: term.id, schoolId });
    return term;
  }

  async getCurrentTerm(schoolId: string) {
    const term = await this.prisma.term.findFirst({
      where: { schoolId, isCurrent: true },
      include: { academicYear: true },
    });
    return term;
  }

  // ─── TIMETABLE ──────────────────────────────────────

  async createTimetableEntry(
    data: { classId: string; subjectId: string; teacherId: string; dayOfWeek: DayOfWeek; periodNumber: number; startTime: string; endTime: string },
    schoolId: string,
    userId: string,
  ) {
    const entry = await this.prisma.timetableEntry.create({
      data: { ...data, schoolId },
      include: { class: true, subject: true },
    });

    await this.auditService.log({ userId, action: 'CREATE_TIMETABLE_ENTRY', entity: 'TimetableEntry', entityId: entry.id, schoolId });
    return entry;
  }

  async getTimetable(schoolId: string, classId: string) {
    return this.prisma.timetableEntry.findMany({
      where: { schoolId, classId },
      include: { subject: true },
      orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
    });
  }

  async deleteTimetableEntry(id: string, schoolId: string, userId: string) {
    const entry = await this.prisma.timetableEntry.findFirst({ where: { id, schoolId } });
    if (!entry) throw new NotFoundException('Entry not found');

    await this.prisma.timetableEntry.delete({ where: { id } });
    await this.auditService.log({ userId, action: 'DELETE_TIMETABLE_ENTRY', entity: 'TimetableEntry', entityId: id, schoolId });
  }
}
