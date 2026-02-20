import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnnouncementService } from './announcement.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Announcements')
@ApiBearerAuth()
@Controller('announcements')
export class AnnouncementController {
  constructor(private announcementService: AnnouncementService) {}

  @Post()
  @Roles(Role.SCHOOL_ADMIN, Role.HEAD_TEACHER, Role.TEACHER)
  @ApiOperation({ summary: 'Create announcement' })
  async create(@Body() dto: any, @CurrentUser() user: any) {
    const announcement = await this.announcementService.create(dto, user.id, user.schoolId);
    return { success: true, data: announcement };
  }

  @Get()
  @ApiOperation({ summary: 'List announcements' })
  async findAll(
    @CurrentUser('schoolId') schoolId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.announcementService.findAll(schoolId, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
    return { success: true, ...result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get announcement' })
  async findById(@Param('id') id: string, @CurrentUser('schoolId') schoolId: string) {
    const announcement = await this.announcementService.findById(id, schoolId);
    return { success: true, data: announcement };
  }

  @Put(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.HEAD_TEACHER)
  @ApiOperation({ summary: 'Update announcement' })
  async update(@Param('id') id: string, @Body() dto: any, @CurrentUser('schoolId') schoolId: string) {
    const announcement = await this.announcementService.update(id, schoolId, dto);
    return { success: true, data: announcement };
  }

  @Delete(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.HEAD_TEACHER)
  @ApiOperation({ summary: 'Delete announcement' })
  async delete(@Param('id') id: string, @CurrentUser('schoolId') schoolId: string) {
    await this.announcementService.delete(id, schoolId);
    return { success: true, message: 'Announcement deleted' };
  }
}
