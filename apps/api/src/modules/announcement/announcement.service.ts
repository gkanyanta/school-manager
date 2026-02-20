import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { AnnouncementTarget } from '@prisma/client';

@Injectable()
export class AnnouncementService {
  constructor(private prisma: PrismaService) {}

  async create(
    data: { title: string; content: string; target: AnnouncementTarget; classId?: string; publishAt?: string | Date },
    authorId: string,
    schoolId: string,
  ) {
    return this.prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        target: data.target,
        classId: data.target === 'CLASS' ? data.classId : null,
        publishAt: data.publishAt ? new Date(data.publishAt) : null,
        isPublished: !data.publishAt,
        authorId,
        schoolId,
      },
      include: { author: { select: { firstName: true, lastName: true } }, class: true },
    });
  }

  async findAll(schoolId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where: { schoolId },
        include: {
          author: { select: { firstName: true, lastName: true } },
          class: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.announcement.count({ where: { schoolId } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findForParent(schoolId: string, studentClassIds: string[]) {
    return this.prisma.announcement.findMany({
      where: {
        schoolId,
        isPublished: true,
        OR: [
          { target: 'SCHOOL' },
          { target: 'CLASS', classId: { in: studentClassIds } },
        ],
      },
      include: { author: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findById(id: string, schoolId: string) {
    const announcement = await this.prisma.announcement.findFirst({
      where: { id, schoolId },
      include: { author: { select: { firstName: true, lastName: true } }, class: true },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');
    return announcement;
  }

  async update(id: string, schoolId: string, data: Partial<{ title: string; content: string; isPublished: boolean }>) {
    await this.findById(id, schoolId);
    return this.prisma.announcement.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, schoolId: string) {
    await this.findById(id, schoolId);
    await this.prisma.announcement.delete({ where: { id } });
  }
}
