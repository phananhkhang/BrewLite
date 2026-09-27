import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ErrorCodes } from '../../common/constants/error-codes.constants.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { QueryUserDto } from './dto/query-user.dto.js';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy thông tin profile người dùng chi tiết (kèm roles & permissions)
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        status: true,
        isEmailVerified: true,
        createdAt: true,
        userRoles: {
          select: {
            role: {
              select: { code: true, name: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException({
        success: false,
        statusCode: 404,
        errorCode: ErrorCodes.E_USER_NOT_FOUND,
        message: 'Người dùng không tồn tại.',
      });
    }

    return {
      ...user,
      roles: user.userRoles.map((ur) => ur.role.code),
    };
  }

  /**
   * Alias tìm người dùng theo ID (cho Auth/Guards/Controllers)
   */
  async findById(userId: string) {
    return this.getProfile(userId);
  }

  /**
   * Tìm người dùng theo Email
   */
  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });
  }

  /**
   * Cập nhật thông tin profile cá nhân
   */
  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException({
        success: false,
        statusCode: 404,
        errorCode: ErrorCodes.E_USER_NOT_FOUND,
        message: 'Người dùng không tồn tại.',
      });
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName ? { firstName: dto.firstName } : {}),
        ...(dto.lastName ? { lastName: dto.lastName } : {}),
        ...(dto.phone ? { phone: dto.phone } : {}),
        ...(dto.avatarUrl ? { avatarUrl: dto.avatarUrl } : {}),
        ...(dto.password ? { passwordHash: dto.password } : {}),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Tạo tài khoản bởi Quản trị viên (Admin)
   */
  async createByAdmin(dto: CreateUserDto, passwordHash: string) {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });

    if (existing) {
      throw new ConflictException({
        success: false,
        statusCode: 409,
        errorCode: ErrorCodes.E_USER_ALREADY_EXISTS,
        message: `Email '${dto.email}' đã tồn tại trong hệ thống.`,
      });
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName || 'Nhân viên',
        lastName: dto.lastName || 'Mới',
        phone: dto.phone,
        status: 'ACTIVE',
        isEmailVerified: true,
      },
    });

    const roleCode = dto.role || 'BARISTA';
    try {
      const role = await this.prisma.role.findUnique({
        where: { code: roleCode },
      });
      if (role) {
        await this.prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: role.id,
          },
        });
      }
    } catch {
      // Bỏ qua nếu bảng role chưa được seed
    }

    return this.getProfile(user.id);
  }

  /**
   * Phân bổ vai trò (Roles) cho người dùng
   */
  async updateRole(userId: string, dto: UpdateUserRolesDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException({
        success: false,
        statusCode: 404,
        errorCode: ErrorCodes.E_USER_NOT_FOUND,
        message: 'Người dùng không tồn tại.',
      });
    }

    try {
      const role = await this.prisma.role.findUnique({
        where: { code: dto.role },
      });

      if (role) {
        // Xóa roles cũ và gán role mới
        await this.prisma.userRole.deleteMany({
          where: { userId },
        });

        await this.prisma.userRole.create({
          data: {
            userId,
            roleId: role.id,
          },
        });
      }
    } catch {
      // Bỏ qua nếu bảng role chưa sẵn sàng
    }

    return this.getProfile(userId);
  }

  /**
   * Khóa hoặc kích hoạt tài khoản
   */
  async setStatus(userId: string, isActive: boolean) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException({
        success: false,
        statusCode: 404,
        errorCode: ErrorCodes.E_USER_NOT_FOUND,
        message: 'Người dùng không tồn tại.',
      });
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        status: isActive ? 'ACTIVE' : 'SUSPENDED',
      },
      select: {
        id: true,
        email: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Danh sách người dùng phân trang & tìm kiếm
   */
  async findAll(query: QueryUserDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, records] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          status: true,
          createdAt: true,
          userRoles: {
            select: {
              role: {
                select: { code: true, name: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      users: records.map((u) => ({
        ...u,
        roles: u.userRoles.map((ur) => ur.role.code),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}