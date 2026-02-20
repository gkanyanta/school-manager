import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { AssessmentType } from '@prisma/client';

@Injectable()
export class AssessmentService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async createAssessment(
    data: {
      name: string;
      type: AssessmentType;
      subjectId: string;
      classId: string;
      termId: string;
      totalMarks: number;
      weight: number;
      date?: string | Date;
    },
    teacherId: string,
    schoolId: string,
  ) {
    const [subject, cls, term] = await Promise.all([
      this.prisma.subject.findFirst({ where: { id: data.subjectId, schoolId } }),
      this.prisma.class.findFirst({ where: { id: data.classId, schoolId } }),
      this.prisma.term.findFirst({ where: { id: data.termId, schoolId } }),
    ]);

    if (!subject) throw new BadRequestException('Subject not found');
    if (!cls) throw new BadRequestException('Class not found');
    if (!term) throw new BadRequestException('Term not found');

    const assessment = await this.prisma.assessment.create({
      data: {
        name: data.name,
        type: data.type,
        totalMarks: data.totalMarks,
        weight: data.weight,
        date: data.date ? new Date(data.date) : null,
        subjectId: data.subjectId,
        classId: data.classId,
        termId: data.termId,
        teacherId,
        schoolId,
      },
      include: { subject: true, class: true, term: true },
    });

    await this.auditService.log({
      userId: teacherId,
      action: 'CREATE_ASSESSMENT',
      entity: 'Assessment',
      entityId: assessment.id,
      schoolId,
    });

    return assessment;
  }

  async getAssessments(schoolId: string, classId?: string, subjectId?: string, termId?: string) {
    const where: any = { schoolId };
    if (classId) where.classId = classId;
    if (subjectId) where.subjectId = subjectId;
    if (termId) where.termId = termId;

    return this.prisma.assessment.findMany({
      where,
      include: {
        subject: true,
        class: { include: { grade: true } },
        term: true,
        teacher: { select: { firstName: true, lastName: true } },
        _count: { select: { markEntries: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async enterMarks(
    assessmentId: string,
    marks: { studentId: string; score: number; remarks?: string }[],
    teacherId: string,
    schoolId: string,
  ) {
    const assessment = await this.prisma.assessment.findFirst({
      where: { id: assessmentId, schoolId },
    });
    if (!assessment) throw new NotFoundException('Assessment not found');

    for (const m of marks) {
      if (m.score > assessment.totalMarks) {
        throw new BadRequestException(`Score ${m.score} exceeds total marks ${assessment.totalMarks}`);
      }
    }

    await this.prisma.$transaction(async (tx) => {
      for (const m of marks) {
        await tx.markEntry.upsert({
          where: {
            studentId_assessmentId: {
              studentId: m.studentId,
              assessmentId,
            },
          },
          update: { score: m.score, remarks: m.remarks },
          create: {
            studentId: m.studentId,
            assessmentId,
            score: m.score,
            remarks: m.remarks,
          },
        });
      }
    });

    await this.auditService.log({
      userId: teacherId,
      action: 'ENTER_MARKS',
      entity: 'Assessment',
      entityId: assessmentId,
      schoolId,
    });

    return this.prisma.markEntry.findMany({
      where: { assessmentId },
      include: { student: true },
    });
  }

  async getMarks(assessmentId: string, schoolId: string) {
    const assessment = await this.prisma.assessment.findFirst({
      where: { id: assessmentId, schoolId },
      include: { subject: true, class: true },
    });
    if (!assessment) throw new NotFoundException('Assessment not found');

    const marks = await this.prisma.markEntry.findMany({
      where: { assessmentId },
      include: { student: true },
      orderBy: { student: { firstName: 'asc' } },
    });

    return { assessment, marks };
  }

  async getStudentResults(studentId: string, termId: string, schoolId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId },
      include: { class: { include: { grade: true } } },
    });
    if (!student) throw new NotFoundException('Student not found');

    const marks = await this.prisma.markEntry.findMany({
      where: {
        studentId,
        assessment: { termId, schoolId },
      },
      include: {
        assessment: { include: { subject: true } },
      },
    });

    // Group by subject
    const subjectMap = new Map<string, { subject: any; assessments: any[]; totalWeightedScore: number; totalWeight: number }>();

    for (const mark of marks) {
      const subId = mark.assessment.subjectId;
      if (!subjectMap.has(subId)) {
        subjectMap.set(subId, {
          subject: mark.assessment.subject,
          assessments: [],
          totalWeightedScore: 0,
          totalWeight: 0,
        });
      }
      const entry = subjectMap.get(subId)!;
      const percentage = (mark.score / mark.assessment.totalMarks) * 100;
      const weightedScore = percentage * (mark.assessment.weight / 100);
      entry.assessments.push({
        name: mark.assessment.name,
        type: mark.assessment.type,
        score: mark.score,
        totalMarks: mark.assessment.totalMarks,
        percentage,
        weight: mark.assessment.weight,
        weightedScore,
        remarks: mark.remarks,
      });
      entry.totalWeightedScore += weightedScore;
      entry.totalWeight += mark.assessment.weight;
    }

    const results = Array.from(subjectMap.values()).map((entry) => {
      // Normalize: if total weight < 100%, scale up to give accurate current grades
      const finalPercentage = entry.totalWeight > 0
        ? (entry.totalWeightedScore / entry.totalWeight) * 100
        : 0;
      return {
        subject: entry.subject,
        assessments: entry.assessments,
        finalPercentage: Math.round(finalPercentage * 10) / 10,
        grade: this.getGrade(finalPercentage),
        remarks: this.getRemarks(finalPercentage),
      };
    });

    const overallAvg = results.length > 0
      ? results.reduce((sum, r) => sum + r.finalPercentage, 0) / results.length
      : 0;

    return {
      student,
      results,
      overall: {
        average: Math.round(overallAvg * 10) / 10,
        grade: this.getGrade(overallAvg),
        remarks: this.getRemarks(overallAvg),
      },
    };
  }

  async getClassResults(classId: string, termId: string, schoolId: string) {
    const students = await this.prisma.student.findMany({
      where: { classId, schoolId, status: 'ACTIVE' },
      orderBy: { firstName: 'asc' },
    });

    const results = await Promise.all(
      students.map((s) => this.getStudentResults(s.id, termId, schoolId)),
    );

    return results;
  }

  private getGrade(percentage: number): string {
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    if (percentage >= 40) return 'E';
    return 'F';
  }

  private getRemarks(percentage: number): string {
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 70) return 'Very Good';
    if (percentage >= 60) return 'Good';
    if (percentage >= 50) return 'Satisfactory';
    if (percentage >= 40) return 'Fair';
    return 'Needs Improvement';
  }
}
