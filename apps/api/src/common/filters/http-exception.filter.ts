import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCodes } from '../constants/error-codes.constants.js';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode: string = ErrorCodes.E_INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Đã xảy ra lỗi máy chủ nội bộ.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        if (resObj.errorCode && typeof resObj.errorCode === 'string') {
          errorCode = resObj.errorCode;
        } else {
          errorCode = this.mapStatusToErrorCode(status);
        }

        if (Array.isArray(resObj.message)) {
          message = resObj.message;
        } else if (typeof resObj.message === 'string') {
          message = resObj.message;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
    } else {
      this.logger.error('Unknown Exception thrown', String(exception));
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      errorCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private mapStatusToErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return ErrorCodes.E_UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCodes.E_FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCodes.E_USER_NOT_FOUND;
      case HttpStatus.BAD_REQUEST:
        return ErrorCodes.E_VALIDATION_ERROR;
      case HttpStatus.CONFLICT:
        return ErrorCodes.E_USER_ALREADY_EXISTS;
      default:
        return ErrorCodes.E_INTERNAL_SERVER_ERROR;
    }
  }
}
