import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ErrorCodes } from '../../../common/constants/error-codes.constants.js';
import { authConfig } from '../../../config/auth.config.js';
import { TokenPayload } from '../interfaces/token-payload.interface.js';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          if (request?.body?.refreshToken) {
            return request.body.refreshToken;
          }
          const authHeader = request?.headers?.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: authConfig.refreshTokenSecret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: TokenPayload) {
    const refreshToken = req.body?.refreshToken;
    if (!payload || !payload.sub || !refreshToken) {
      throw new UnauthorizedException({
        success: false,
        statusCode: 401,
        errorCode: ErrorCodes.E_INVALID_TOKEN,
        message: 'Refresh token không hợp lệ.',
      });
    }

    return {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
      roles: payload.roles || [payload.role],
      permissions: payload.permissions || [],
      refreshToken,
    };
  }
}
