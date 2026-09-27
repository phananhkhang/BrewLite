import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ErrorCodes } from '../../../common/constants/error-codes.constants.js';
import { authConfig } from '../../../config/auth.config.js';
import { TokenPayload } from '../interfaces/token-payload.interface.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: authConfig.jwtSecret,
      issuer: authConfig.jwtIssuer,
      audience: authConfig.jwtAudience,
    });
  }

  async validate(payload: TokenPayload) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException({
        success: false,
        statusCode: 401,
        errorCode: ErrorCodes.E_INVALID_TOKEN,
        message: 'Token không hợp lệ hoặc đã hết hạn.',
      });
    }

    return {
      id: payload.sub,
      username: payload.username,
      email: payload.email || payload.username,
      role: payload.role,
      roles: payload.roles || [payload.role],
      permissions: payload.permissions || [],
    };
  }
}
