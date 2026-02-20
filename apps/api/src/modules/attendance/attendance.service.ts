import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { AttendanceStatus } from '@prisma/client';

interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  reason?: string;
}

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async markAttendance(
    classId: string,
    date: string | Date,
    records: AttendanceRecord[],
    teacherId: string,
    schoolId: string,
  ) {
    const cls = await this.prisma.class.findFirst({ where: { id: classId, schoolId } });
    if (!cls) throw new BadRequestException('Class not found');

    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    const session = await this.prisma.$transaction(async (tx) => {
      // Upsert session
      let existing = await tx.attendanceSession.findFirst({
        where: { date: dateObj, classId, schoolId },
      });

      if (existing) {
        // Delete old records and re-insert
        await tx.attendanceRecord.deleteMany({ where: { attendanceSessionId: existing.id } });
      } else {
        existing = await tx.attendanceSession.create({
          data: { date: dateObj, classId, teacherId, schoolId },
        });
      }

      // Insert new records
      await tx.attendanceRecord.createMany({
        data: records.map((r) => ({
          studentId: r.studentId,
          status: r.status,
          reason: r.reason,
          attendanceSessionId: existing!.id,
        })),
      });

      return tx.attendanceSession.findUnique({
        where: { id: existing!.id },
        include: { records: { include: { student: true } }, class: true },
      });
    });

    await this.auditService.log({
      userId: teacherId,
      action: 'MARK_ATTENDANCE',
      entity: 'AttendanceSession',
      entityId: session!.id,
      schoolId,
    });

    return session;
  }

  async getAttendanceByClass(classId: string, schoolId: string, startDate?: string, endDate?: string) {
    const where: any = { classId, schoolId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    return this.prisma.attendanceSession.findMany({
      where,
      include: {
        records: { include: { student: true } },
        teacher: { select: { firstName: true, lastName: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getAttendanceByStudent(studentId: string, schoolId: string) {
    const student = await this.prisma.student.findFirst({ where: { id: studentId, schoolId } });
    if (!student) throw new NotFoundException('Student not found');

    const records = await this.prisma.attendanceRecord.findMany({
      where: { studentId },
      include: {
        attendanceSession: {
          include: { class: true },
        },
      },
      orderBy: { attendanceSession: { date: 'desc' } },
    });

    const total = records.length;
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;

    return {
      records,
      summary: { total, present, absent, late, rate: total > 0 ? ((present + late) / total * 100).toFixed(1) : '0' },
    };
  }

  async getClassAttendanceSummary(classId: string, schoolId: string) {
    const students = await this.prisma.student.findMany({
      where: { classId, schoolId, status: 'ACTIVE' },
    });

    const summaries = await Promise.all(
      students.map(async (student) => {
        const records = await this.prisma.attendanceRecord.findMany({
          where: { studentId: student.id },
        });
        const total = records.length;
        const present = records.filter((r) => r.status === 'PRESENT').length;
        const absent = records.filter((r) => r.status === 'ABSENT').length;
        const late = records.filter((r) => r.status === 'LATE').length;

        return {
          student: { id: student.id, firstName: student.firstName, lastName: student.lastName, admissionNumber: student.admissionNumber },
          total,
          present,
          absent,
          late,
          rate: total > 0 ? ((present + late) / total * 100).toFixed(1) : '0',
        };
      }),
    );

    return summaries;
  }
}
