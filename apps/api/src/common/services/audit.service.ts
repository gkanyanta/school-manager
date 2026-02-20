import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

interface AuditEntry {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ip?: string;
  schoolId?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(entry: AuditEntry) {
    return this.prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        before: entry.before as any,
        after: entry.after as any,
        ip: entry.ip,
        schoolId: entry.schoolId,
      },
    });
  }
}
