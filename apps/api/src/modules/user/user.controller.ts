import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import bcrypt from 'bcryptjs';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RequireRoles } from '../../common/decorators/roles.decorator.js';
import { authConfig } from '../../config/auth.config.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { QueryUserDto } from './dto/query-user.dto.js';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserEntity } from './entities/user.entity.js';
import { UserService } from './user.service.js';

@ApiTags('User - Quản lý tài khoản')
@ApiBearerAuth('JWT-auth')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin profile người dùng hiện tại' })
  @ApiResponse({ status: 200, description: 'Thông tin tài khoản đăng nhập.' })
  async getProfile(@CurrentUser('id') userId: string): Promise<UserEntity | null> {
    return this.userService.findById(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Cập nhật thông tin profile cá nhân' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công.' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserEntity> {
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, authConfig.bcryptSaltRounds);
    }
    return this.userService.updateProfile(userId, dto);
  }

  @RequireRoles('ADMIN')
  @Get()
  @ApiOperation({ summary: 'Danh sách người dùng (Dành cho Admin)' })
  @ApiResponse({ status: 200, description: 'Danh sách và tổng số bản ghi.' })
  async findAll(@Query() query: QueryUserDto) {
    return this.userService.findAll(query);
  }

  @RequireRoles('ADMIN')
  @Post()
  @ApiOperation({ summary: 'Tạo tài khoản nội bộ mới (Dành cho Admin)' })
  @ApiResponse({ status: 201, description: 'Tạo tài khoản thành công.' })
  async createByAdmin(@Body() dto: CreateUserDto): Promise<UserEntity> {
    const passwordHash = await bcrypt.hash(dto.password, authConfig.bcryptSaltRounds);
    return this.userService.createByAdmin(dto, passwordHash);
  }

  @RequireRoles('ADMIN')
  @Patch(':id/roles')
  @ApiOperation({ summary: 'Cập nhật phân quyền / vai trò của người dùng' })
  @ApiResponse({ status: 200, description: 'Cập nhật vai trò thành công.' })
  async updateRoles(
    @Param('id') id: string,
    @Body() dto: UpdateUserRolesDto,
  ): Promise<UserEntity> {
    return this.userService.updateRole(id, dto);
  }

  @RequireRoles('ADMIN')
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kích hoạt hoặc khóa tài khoản người dùng' })
  @ApiResponse({ status: 200, description: 'Cập nhật trạng thái thành công.' })
  async toggleStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ): Promise<UserEntity> {
    return this.userService.setStatus(id, isActive);
  }
}
