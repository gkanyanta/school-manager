import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

@Injectable()
export class SchoolContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    // Super admin doesn't need school context for platform-level operations
    if (user.role === Role.SUPER_ADMIN) return true;

    // All other roles must have a schoolId
    if (!user.schoolId) {
      throw new ForbiddenException('No school context found');
    }

    return true;
  }
}
