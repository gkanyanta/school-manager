import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { AuthService } from '../auth/auth.service';
import { Role } from '@prisma/client';

interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  schoolId: string;
}

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private authService: AuthService,
  ) {}

  async create(data: CreateUserInput, createdBy: string) {
    const existing = await this.prisma.user.findFirst({
      where: { email: data.email, schoolId: data.schoolId },
    });
    if (existing) {
      throw new BadRequestException('User with this email already exists in this school');
    }

    const passwordHash = await this.authService.hashPassword(data.password);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
        schoolId: data.schoolId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        schoolId: true,
        isActive: true,
        createdAt: true,
      },
    });

    await this.auditService.log({
      userId: createdBy,
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user.id,
      after: user as any,
      schoolId: data.schoolId,
    });

    return user;
  }

  async findAll(schoolId: string, page = 1, limit = 20, search?: string, role?: Role) {
    const where: any = { schoolId };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { firstName: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string, schoolId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, schoolId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        schoolId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, schoolId: string, data: Partial<CreateUserInput>, updatedBy: string) {
    const before = await this.findById(id, schoolId);

    const updateData: any = {};
    if (data.email) updateData.email = data.email;
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.role) updateData.role = data.role;

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        schoolId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await this.auditService.log({
      userId: updatedBy,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: id,
      before: before as any,
      after: user as any,
      schoolId,
    });

    return user;
  }

  async toggleActive(id: string, schoolId: string, updatedBy: string) {
    const user = await this.findById(id, schoolId);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });

    await this.auditService.log({
      userId: updatedBy,
      action: user.isActive ? 'DEACTIVATE_USER' : 'ACTIVATE_USER',
      entity: 'User',
      entityId: id,
      schoolId,
    });

    return updated;
  }
}
