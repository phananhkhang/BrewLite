import {
  BadRequestException,
  Injectable,
  ValidationPipe as NestValidationPipe,
} from '@nestjs/common';
import { ErrorCodes } from '../constants/error-codes.constants.js';

@Injectable()
export class CustomValidationPipe extends NestValidationPipe {
  constructor() {
    super({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const messages = errors.flatMap((err) => {
          if (err.constraints) {
            return Object.values(err.constraints);
          }
          if (err.children && err.children.length > 0) {
            return err.children.flatMap((c) =>
              c.constraints ? Object.values(c.constraints) : [],
            );
          }
          return ['Dữ liệu đầu vào không hợp lệ.'];
        });

        return new BadRequestException({
          success: false,
          statusCode: 400,
          errorCode: ErrorCodes.E_VALIDATION_ERROR,
          message: messages,
        });
      },
    });
  }
}
