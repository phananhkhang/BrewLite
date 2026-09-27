import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../constants/auth.constants.js';
import { ErrorCodes } from '../constants/error-codes.constants.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = ctxGetRequest(context);
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException({
        success: false,
        statusCode: 401,
        errorCode: ErrorCodes.E_UNAUTHORIZED,
        message: 'Không tìm thấy thông tin xác thực của người dùng.',
      });
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException({
        success: false,
        statusCode: 403,
        errorCode: ErrorCodes.E_FORBIDDEN,
        message: 'Bạn không có quyền thực hiện thao tác này.',
      });
    }

    return true;
  }
}

function ctxGetRequest(context: ExecutionContext) {
  return context.switchToHttp().getRequest();
}
