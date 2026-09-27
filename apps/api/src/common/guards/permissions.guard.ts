import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../constants/auth.constants.js';
import { ErrorCodes } from '../constants/error-codes.constants.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException({
        success: false,
        statusCode: 401,
        errorCode: ErrorCodes.E_UNAUTHORIZED,
        message: 'Yêu cầu xác thực tài khoản.',
      });
    }

    // Quản trị viên (ADMIN) tự động có toàn bộ quyền
    if (user.role === 'ADMIN') {
      return true;
    }

    const userPermissions: string[] = user.permissions || [];
    const hasAllRequired = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasAllRequired) {
      throw new ForbiddenException({
        success: false,
        statusCode: 403,
        errorCode: ErrorCodes.E_FORBIDDEN,
        message: 'Bạn không có đủ quyền chi tiết để truy cập tài nguyên này.',
      });
    }

    return true;
  }
}
