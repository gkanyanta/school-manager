import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { StudentStatus } from '@prisma/client';

interface CreateStudentInput {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string | Date;
  gender: 'MALE' | 'FEMALE';
  admissionNumber: string;
  admissionDate: string | Date;
  classId: string;
  address?: string;
  medicalNotes?: string;
  status?: StudentStatus;
  guardians?: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    relationship: string;
    isPrimary: boolean;
  }[];
}

@Injectable()
export class StudentService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(data: CreateStudentInput, schoolId: string, userId: string) {
    const existing = await this.prisma.student.findFirst({
      where: { admissionNumber: data.admissionNumber, schoolId },
    });
    if (existing) {
      throw new BadRequestException('Admission number already exists');
    }

    const classObj = await this.prisma.class.findFirst({
      where: { id: data.classId, schoolId },
    });
    if (!classObj) throw new BadRequestException('Class not found');

    const student = await this.prisma.$transaction(async (tx) => {
      const s = await tx.student.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          middleName: data.middleName,
          dateOfBirth: new Date(data.dateOfBirth),
          gender: data.gender,
          admissionNumber: data.admissionNumber,
          admissionDate: new Date(data.admissionDate),
          classId: data.classId,
          schoolId,
          address: data.address,
          medicalNotes: data.medicalNotes,
          status: data.status || 'ACTIVE',
        },
        include: { class: { include: { grade: true } } },
      });

      if (data.guardians && data.guardians.length > 0) {
        for (const g of data.guardians) {
          const guardian = await tx.guardian.create({
            data: {
              firstName: g.firstName,
              lastName: g.lastName,
              phone: g.phone,
              email: g.email,
              schoolId,
            },
          });
          await tx.studentGuardian.create({
            data: {
              studentId: s.id,
              guardianId: guardian.id,
              relationship: g.relationship,
              isPrimary: g.isPrimary,
            },
          });
        }
      }

      return s;
    });

    await this.auditService.log({
      userId,
      action: 'CREATE_STUDENT',
      entity: 'Student',
      entityId: student.id,
      schoolId,
    });

    return student;
  }

  async findAll(schoolId: string, page = 1, limit = 20, search?: string, classId?: string, status?: StudentStatus) {
    const where: any = { schoolId };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { admissionNumber: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (classId) where.classId = classId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        include: {
          class: { include: { grade: true } },
          guardianLinks: { include: { guardian: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { firstName: 'asc' },
      }),
      this.prisma.student.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string, schoolId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id, schoolId },
      include: {
        class: { include: { grade: true } },
        guardianLinks: { include: { guardian: true } },
        documents: true,
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async update(id: string, schoolId: string, data: Partial<CreateStudentInput>, userId: string) {
    await this.findById(id, schoolId);

    const updateData: any = {};
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.middleName !== undefined) updateData.middleName = data.middleName;
    if (data.dateOfBirth) updateData.dateOfBirth = new Date(data.dateOfBirth);
    if (data.gender) updateData.gender = data.gender;
    if (data.admissionNumber) updateData.admissionNumber = data.admissionNumber;
    if (data.classId) updateData.classId = data.classId;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.medicalNotes !== undefined) updateData.medicalNotes = data.medicalNotes;
    if (data.status) updateData.status = data.status;

    const student = await this.prisma.student.update({
      where: { id },
      data: updateData,
      include: { class: { include: { grade: true } } },
    });

    await this.auditService.log({
      userId,
      action: 'UPDATE_STUDENT',
      entity: 'Student',
      entityId: id,
      schoolId,
    });

    return student;
  }

  async findByGuardianUserId(userId: string, schoolId: string) {
    const guardian = await this.prisma.guardian.findFirst({
      where: { userId, schoolId },
    });
    if (!guardian) return [];

    const links = await this.prisma.studentGuardian.findMany({
      where: { guardianId: guardian.id },
      include: {
        student: {
          include: { class: { include: { grade: true } } },
        },
      },
    });

    return links.map((l) => l.student);
  }

  async exportCsv(schoolId: string, classId?: string) {
    const where: any = { schoolId };
    if (classId) where.classId = classId;

    const students = await this.prisma.student.findMany({
      where,
      include: {
        class: { include: { grade: true } },
        guardianLinks: { include: { guardian: true } },
      },
      orderBy: { admissionNumber: 'asc' },
    });

    const rows = students.map((s) => {
      const primary = s.guardianLinks.find((l) => l.isPrimary)?.guardian;
      return {
        admissionNumber: s.admissionNumber,
        firstName: s.firstName,
        lastName: s.lastName,
        middleName: s.middleName || '',
        dateOfBirth: s.dateOfBirth.toISOString().split('T')[0],
        gender: s.gender,
        grade: s.class.grade.name,
        class: s.class.name,
        status: s.status,
        guardianName: primary ? `${primary.firstName} ${primary.lastName}` : '',
        guardianPhone: primary?.phone || '',
        guardianEmail: primary?.email || '',
      };
    });

    return rows;
  }
}
