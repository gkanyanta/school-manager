import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SchoolService } from './school.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '@prisma/client';

class CreateSchoolDto {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  motto?: string;
}

class UpdateSchoolDto {
  name?: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  motto?: string;
  isActive?: boolean;
}

@ApiTags('Schools')
@Controller('schools')
export class SchoolController {
  constructor(private schoolService: SchoolService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new school (Super Admin only)' })
  async create(@Body() dto: CreateSchoolDto, @CurrentUser('id') userId: string) {
    const school = await this.schoolService.create(dto, userId);
    return { success: true, data: school };
  }

  @Get()
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all schools (Super Admin only)' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.schoolService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      search,
    );
    return { success: true, ...result };
  }

  @Public()
  @Get('lookup/:code')
  @ApiOperation({ summary: 'Lookup school by code (public, for login)' })
  async lookupByCode(@Param('code') code: string) {
    const school = await this.schoolService.findByCode(code);
    return {
      success: true,
      data: {
        id: school.id,
        name: school.name,
        code: school.code,
        logo: school.logo,
        motto: school.motto,
      },
    };
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get school by ID' })
  async findById(@Param('id') id: string) {
    const school = await this.schoolService.findById(id);
    return { success: true, data: school };
  }

  @Get(':id/stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get school statistics' })
  async getStats(@Param('id') id: string) {
    const stats = await this.schoolService.getStats(id);
    return { success: true, data: stats };
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update school' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSchoolDto,
    @CurrentUser('id') userId: string,
  ) {
    const school = await this.schoolService.update(id, dto, userId);
    return { success: true, data: school };
  }
}
