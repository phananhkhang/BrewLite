import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../constants/auth.constants.js';
import { ErrorCodes } from '../constants/error-codes.constants.js';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  override handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser | false,
    info: unknown,
  ): TUser {
    if (err || !user) {
      const message =
        info instanceof Error
          ? info.message
          : 'Yêu cầu xác thực tài khoản trước khi truy cập.';
      throw new UnauthorizedException({
        success: false,
        statusCode: 401,
        errorCode: ErrorCodes.E_UNAUTHORIZED,
        message,
      });
    }
    return user;
  }
}
