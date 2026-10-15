import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();

    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message: string | string[] = 'Unexpected server error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        code = this.getDefaultCode(statusCode);
      } else {
        const responseBody = exceptionResponse as {
          code?: string;
          message?: string | string[];
        };

        message = responseBody.message ?? exception.message;

        code =
          responseBody.code ??
          this.getDefaultCode(
            statusCode,
            Array.isArray(responseBody.message),
          );
      }
    } else {
      this.logger.error(
        'Unhandled exception',
        exception instanceof Error
          ? exception.stack
          : String(exception),
      );
    }

    response.status(statusCode).json({
      statusCode,
      code,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private getDefaultCode(
    statusCode: number,
    validationError = false,
  ): string {
    if (
      statusCode === HttpStatus.BAD_REQUEST &&
      validationError
    ) {
      return 'VALIDATION_ERROR';
    }

    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';

      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';

      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';

      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';

      case HttpStatus.CONFLICT:
        return 'CONFLICT';

      case HttpStatus.PAYLOAD_TOO_LARGE:
        return 'PAYLOAD_TOO_LARGE';

      default:
        return 'HTTP_ERROR';
    }
  }
}