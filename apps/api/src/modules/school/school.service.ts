import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { AuditService } from '../../common/services/audit.service';

interface CreateSchoolInput {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  motto?: string;
}

interface UpdateSchoolInput {
  name?: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  motto?: string;
  isActive?: boolean;
}

@Injectable()
export class SchoolService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(data: CreateSchoolInput, userId: string) {
    const existing = await this.prisma.school.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      throw new BadRequestException('School code already exists');
    }

    const school = await this.prisma.school.create({ data });

    await this.auditService.log({
      userId,
      action: 'CREATE_SCHOOL',
      entity: 'School',
      entityId: school.id,
      after: school as any,
    });

    return school;
  }

  async findAll(page = 1, limit = 20, search?: string) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { code: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.school.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.school.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const school = await this.prisma.school.findUnique({ where: { id } });
    if (!school) throw new NotFoundException('School not found');
    return school;
  }

  async findByCode(code: string) {
    const school = await this.prisma.school.findUnique({ where: { code } });
    if (!school) throw new NotFoundException('School not found');
    return school;
  }

  async update(id: string, data: UpdateSchoolInput, userId: string) {
    const before = await this.findById(id);

    if (data.code && data.code !== before.code) {
      const existing = await this.prisma.school.findUnique({
        where: { code: data.code },
      });
      if (existing) throw new BadRequestException('School code already exists');
    }

    const school = await this.prisma.school.update({
      where: { id },
      data,
    });

    await this.auditService.log({
      userId,
      action: 'UPDATE_SCHOOL',
      entity: 'School',
      entityId: id,
      before: before as any,
      after: school as any,
    });

    return school;
  }

  async getStats(schoolId: string) {
    const [students, users, classes, grades] = await Promise.all([
      this.prisma.student.count({ where: { schoolId, status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { schoolId, isActive: true } }),
      this.prisma.class.count({ where: { schoolId } }),
      this.prisma.grade.count({ where: { schoolId } }),
    ]);

    return { students, users, classes, grades };
  }
}
