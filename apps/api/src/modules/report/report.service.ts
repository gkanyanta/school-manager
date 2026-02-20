import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async getEnrollmentReport(schoolId: string) {
    const classes = await this.prisma.class.findMany({
      where: { schoolId },
      include: {
        grade: true,
        _count: {
          select: {
            students: { where: { status: 'ACTIVE' } },
          },
        },
      },
      orderBy: [{ grade: { level: 'asc' } }, { name: 'asc' }],
    });

    const grades = await this.prisma.grade.findMany({
      where: { schoolId },
      include: {
        _count: {
          select: {
            classes: true,
          },
        },
        classes: {
          include: {
            _count: { select: { students: { where: { status: 'ACTIVE' } } } },
          },
        },
      },
      orderBy: { level: 'asc' },
    });

    const gradeReport = grades.map((g) => ({
      grade: g.name,
      classes: g.classes.length,
      students: g.classes.reduce((sum, c) => sum + c._count.students, 0),
    }));

    const totalStudents = gradeReport.reduce((sum, g) => sum + g.students, 0);

    return { grades: gradeReport, totalStudents, classes };
  }

  async getAttendanceTrends(schoolId: string, classId?: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = { schoolId, date: { gte: startDate } };
    if (classId) where.classId = classId;

    const sessions = await this.prisma.attendanceSession.findMany({
      where,
      include: {
        records: true,
        class: true,
      },
      orderBy: { date: 'asc' },
    });

    const trends = sessions.map((s) => {
      const total = s.records.length;
      const present = s.records.filter((r) => r.status === 'PRESENT').length;
      const absent = s.records.filter((r) => r.status === 'ABSENT').length;
      const late = s.records.filter((r) => r.status === 'LATE').length;

      return {
        date: s.date,
        class: s.class.name,
        total,
        present,
        absent,
        late,
        rate: total > 0 ? ((present + late) / total * 100).toFixed(1) : '0',
      };
    });

    return trends;
  }

  async getExamPerformanceSummary(schoolId: string, termId: string) {
    const assessments = await this.prisma.assessment.findMany({
      where: { schoolId, termId },
      include: {
        subject: true,
        class: { include: { grade: true } },
        markEntries: true,
      },
    });

    const subjectSummary = new Map<string, { subject: string; className: string; count: number; average: number; highest: number; lowest: number }>();

    for (const a of assessments) {
      const key = `${a.subject.name}-${a.class.name}`;
      if (!subjectSummary.has(key)) {
        subjectSummary.set(key, {
          subject: a.subject.name,
          className: a.class.name,
          count: 0,
          average: 0,
          highest: 0,
          lowest: Infinity,
        });
      }

      const entry = subjectSummary.get(key)!;
      for (const mark of a.markEntries) {
        const pct = (mark.score / a.totalMarks) * 100;
        entry.count++;
        entry.average += pct;
        entry.highest = Math.max(entry.highest, pct);
        entry.lowest = Math.min(entry.lowest, pct);
      }
    }

    return Array.from(subjectSummary.values()).map((s) => ({
      ...s,
      average: s.count > 0 ? Math.round((s.average / s.count) * 10) / 10 : 0,
      lowest: s.lowest === Infinity ? 0 : Math.round(s.lowest * 10) / 10,
      highest: Math.round(s.highest * 10) / 10,
    }));
  }

  async getFeeCollectionSummary(schoolId: string, termId?: string) {
    const where: any = { schoolId };
    if (termId) where.termId = termId;

    const invoices = await this.prisma.invoice.findMany({
      where,
      include: {
        student: { include: { class: { include: { grade: true } } } },
      },
    });

    const byGrade = new Map<string, { grade: string; totalBilled: number; totalCollected: number; count: number }>();

    for (const inv of invoices) {
      const gradeName = inv.student.class.grade.name;
      if (!byGrade.has(gradeName)) {
        byGrade.set(gradeName, { grade: gradeName, totalBilled: 0, totalCollected: 0, count: 0 });
      }
      const entry = byGrade.get(gradeName)!;
      entry.totalBilled += inv.totalAmount;
      entry.totalCollected += inv.paidAmount;
      entry.count++;
    }

    const gradeBreakdown = Array.from(byGrade.values()).map((g) => ({
      ...g,
      arrears: g.totalBilled - g.totalCollected,
      collectionRate: g.totalBilled > 0 ? ((g.totalCollected / g.totalBilled) * 100).toFixed(1) : '0',
    }));

    const totalBilled = invoices.reduce((s, i) => s + i.totalAmount, 0);
    const totalCollected = invoices.reduce((s, i) => s + i.paidAmount, 0);

    return {
      totalBilled,
      totalCollected,
      totalArrears: totalBilled - totalCollected,
      collectionRate: totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) : '0',
      gradeBreakdown,
    };
  }
}
