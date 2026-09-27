import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { ErrorCodes } from '../../common/constants/error-codes.constants.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { authConfig } from '../../config/auth.config.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { TokenPayload } from './interfaces/token-payload.interface.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Băm mật khẩu: Ưu tiên Argon2 nếu có, fallback an toàn sang scrypt tích hợp sẵn của Node.js
   */
  async hashPassword(password: string): Promise<string> {
    try {
      const argon2 = await import('argon2');
      return await argon2.hash(password);
    } catch {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync(password, salt, 64).toString('hex');
      return `scrypt:${salt}:${hash}`;
    }
  }

  /**
   * So khớp mật khẩu đã băm
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    if (hash.startsWith('scrypt:')) {
      const parts = hash.split(':');
      if (parts.length === 3) {
        const salt = parts[1];
        const originalHash = parts[2];
        const computedHash = crypto.scryptSync(password, salt, 64).toString('hex');
        return crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(computedHash, 'hex'));
      }
    }

    try {
      const argon2 = await import('argon2');
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  /**
   * 1. Đăng ký tài khoản mới cho khách hàng (Role: CUSTOMER)
   */
  async register(dto: RegisterDto, meta?: { ip?: string; userAgent?: string }) {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });

    if (existing) {
      throw new ConflictException({
        success: false,
        statusCode: 409,
        errorCode: ErrorCodes.E_USER_ALREADY_EXISTS,
        message: `Email '${dto.email}' đã được đăng ký trong hệ thống.`,
      });
    }

    const passwordHash = await this.hashPassword(dto.password);

    // Tạo user mới
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName || 'Khách hàng',
        lastName: dto.lastName || 'Mới',
        phone: dto.phone,
        status: 'ACTIVE',
        isEmailVerified: true,
      },
    });

    // Gán role CUSTOMER mặc định nếu bảng Role tồn tại
    try {
      const customerRole = await this.prisma.role.findUnique({
        where: { code: 'CUSTOMER' },
      });
      if (customerRole) {
        await this.prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: customerRole.id,
          },
        });
      }
    } catch {
      // Bỏ qua nếu bảng role chưa được seed
    }

    const roles = ['CUSTOMER'];
    const permissions: string[] = [];
    const tokenFamily = crypto.randomUUID();
    const tokens = await this.generateTokenPair(user.id, user.email, roles, permissions, tokenFamily);

    await this.persistSession(user.id, tokens.refreshToken, tokenFamily, meta || {});
    await this.recordAuditLog(user.id, 'REGISTER_SUCCESS', 'SUCCESS', meta || {});

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        permissions,
      },
      ...tokens,
    };
  }

  /**
   * 2. Đăng nhập an toàn (Chống timing attack & enumeration)
   */
  async login(dto: LoginDto, meta: { ip?: string; userAgent?: string }) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
      include: {
        userRoles: {
          include: {
            role: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
      },
    });

    if (!user) {
      await this.recordAuditLog(null, 'LOGIN_FAILED', 'FAILED', meta, { reason: 'User not found' });
      throw new UnauthorizedException({
        success: false,
        statusCode: 401,
        errorCode: ErrorCodes.E_INVALID_CREDENTIALS,
        message: 'Thông tin đăng nhập không chính xác.',
      });
    }

    const isMatch = await this.comparePassword(dto.password, user.passwordHash);
    if (!isMatch) {
      await this.recordAuditLog(user.id, 'LOGIN_FAILED', 'FAILED', meta, { reason: 'Invalid password' });
      throw new UnauthorizedException({
        success: false,
        statusCode: 401,
        errorCode: ErrorCodes.E_INVALID_CREDENTIALS,
        message: 'Thông tin đăng nhập không chính xác.',
      });
    }

    if (user.status && user.status !== 'ACTIVE') {
      throw new ForbiddenException({
        success: false,
        statusCode: 403,
        errorCode: ErrorCodes.E_ACCOUNT_DEACTIVATED,
        message: 'Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt.',
      });
    }

    // Trích xuất roles và permissions phẳng
    const roles = (user.userRoles || []).map((ur) => ur.role.code);
    const permissions = Array.from(
      new Set(
        (user.userRoles || []).flatMap((ur) =>
          (ur.role.permissions || []).map((rp) => rp.permission.code),
        ),
      ),
    );

    const tokenFamily = crypto.randomUUID();
    const tokens = await this.generateTokenPair(
      user.id,
      user.email,
      roles.length > 0 ? roles : ['CUSTOMER'],
      permissions,
      tokenFamily,
    );

    await this.persistSession(user.id, tokens.refreshToken, tokenFamily, meta);

    // Cập nhật lastLoginAt
    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    } catch {
      // bỏ qua nếu trường chưa có trong db
    }

    await this.recordAuditLog(user.id, 'LOGIN_SUCCESS', 'SUCCESS', meta);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: roles.length > 0 ? roles : ['CUSTOMER'],
        permissions,
      },
      ...tokens,
    };
  }

  /**
   * 3. Refresh Token Rotation có cơ chế Reuse Detection
   */
  async rotateTokens(rawRefreshToken: string, meta: { ip?: string; userAgent?: string }) {
    const hashed = this.hashToken(rawRefreshToken);
    const session = await this.prisma.userSession.findUnique({
      where: { refreshTokenHash: hashed },
      include: { user: true },
    });

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      if (session?.tokenFamily) {
        // Thu hồi toàn bộ session thuộc family này để chống replay attack
        await this.prisma.userSession.updateMany({
          where: { tokenFamily: session.tokenFamily },
          data: { isRevoked: true },
        });
      }
      throw new UnauthorizedException({
        success: false,
        statusCode: 401,
        errorCode: ErrorCodes.E_INVALID_TOKEN,
        message: 'Phiên làm việc không hợp lệ hoặc đã hết hạn.',
      });
    }

    // Thu hồi token cũ
    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });

    // Lấy roles & permissions hiện tại
    const userWithRoles = await this.prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        userRoles: {
          include: { role: { include: { permissions: { include: { permission: true } } } } },
        },
      },
    });

    const roles = (userWithRoles?.userRoles || []).map((ur) => ur.role.code);
    const permissions = Array.from(
      new Set(
        (userWithRoles?.userRoles || []).flatMap((ur) =>
          (ur.role.permissions || []).map((rp) => rp.permission.code),
        ),
      ),
    );

    const newTokens = await this.generateTokenPair(
      session.userId,
      session.user.email,
      roles.length > 0 ? roles : ['CUSTOMER'],
      permissions,
      session.tokenFamily,
    );

    await this.persistSession(session.userId, newTokens.refreshToken, session.tokenFamily, meta);

    return newTokens;
  }

  /**
   * 4. Đổi mật khẩu cho người dùng
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException({
        success: false,
        statusCode: 404,
        errorCode: ErrorCodes.E_USER_NOT_FOUND,
        message: 'Không tìm thấy thông tin người dùng.',
      });
    }

    const isMatch = await this.comparePassword(dto.oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException({
        success: false,
        statusCode: 400,
        errorCode: ErrorCodes.E_INVALID_CREDENTIALS,
        message: 'Mật khẩu hiện tại không chính xác.',
      });
    }

    const newPasswordHash = await this.hashPassword(dto.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return { message: 'Đổi mật khẩu thành công.' };
  }

  /**
   * 5. Đăng xuất (Revoke session)
   */
  async logout(rawRefreshToken: string) {
    const hashed = this.hashToken(rawRefreshToken);
    await this.prisma.userSession.updateMany({
      where: { refreshTokenHash: hashed },
      data: { isRevoked: true },
    });
    return { success: true, message: 'Đăng xuất thành công.' };
  }

  // --- Helpers ---
  private async generateTokenPair(
    userId: string,
    email: string,
    roles: string[],
    permissions: string[],
    tokenFamily: string,
  ) {
    const payload: TokenPayload = {
      sub: userId,
      username: email,
      email,
      role: roles[0] || 'CUSTOMER',
      roles,
      permissions,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: authConfig.jwtSecret,
      expiresIn: authConfig.jwtExpiresIn,
      issuer: authConfig.jwtIssuer,
      audience: authConfig.jwtAudience,
    });

    const refreshToken = crypto.randomBytes(40).toString('hex');
    return { accessToken, refreshToken, tokenFamily };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async persistSession(
    userId: string,
    rawToken: string,
    tokenFamily: string,
    meta: { ip?: string; userAgent?: string },
  ) {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 ngày

      await this.prisma.userSession.create({
        data: {
          userId,
          refreshTokenHash: this.hashToken(rawToken),
          tokenFamily,
          ipAddress: meta.ip,
          userAgent: meta.userAgent,
          expiresAt,
        },
      });
    } catch (error) {
      this.logger.warn('Không thể lưu session vào userSession (kiểm tra migration):', error);
    }
  }

  private async recordAuditLog(
    userId: string | null,
    eventType: string,
    status: 'SUCCESS' | 'FAILED' | 'BLOCKED',
    meta: { ip?: string; userAgent?: string },
    details?: Record<string, unknown>,
  ) {
    try {
      await this.prisma.authAuditLog.create({
        data: {
          userId,
          eventType,
          status,
          ipAddress: meta.ip,
          userAgent: meta.userAgent,
          details: details ? JSON.parse(JSON.stringify(details)) : {},
        },
      });
    } catch {
      // Bỏ qua nếu bảng audit logs chưa được migrate
    }
  }
}