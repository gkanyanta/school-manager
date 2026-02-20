import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

class CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
}

class UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: Role;
}

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create a user in the school' })
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: any) {
    const created = await this.userService.create(
      { ...dto, schoolId: user.schoolId },
      user.id,
    );
    return { success: true, data: created };
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.HEAD_TEACHER)
  @ApiOperation({ summary: 'List users in the school' })
  async findAll(
    @CurrentUser('schoolId') schoolId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: Role,
  ) {
    const result = await this.userService.findAll(
      schoolId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      search,
      role,
    );
    return { success: true, ...result };
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.HEAD_TEACHER)
  @ApiOperation({ summary: 'Get user by ID' })
  async findById(@Param('id') id: string, @CurrentUser('schoolId') schoolId: string) {
    const user = await this.userService.findById(id, schoolId);
    return { success: true, data: user };
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update user' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    const updated = await this.userService.update(id, user.schoolId, dto as any, user.id);
    return { success: true, data: updated };
  }

  @Patch(':id/toggle-active')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Toggle user active status' })
  async toggleActive(@Param('id') id: string, @CurrentUser() user: any) {
    const updated = await this.userService.toggleActive(id, user.schoolId, user.id);
    return { success: true, data: updated };
  }
}
