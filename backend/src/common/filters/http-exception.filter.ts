import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global HTTP Exception Filter
 * 
 * Catches all exceptions and formats them consistently.
 * Logs errors with structured format for debugging.
 * Sanitizes error messages in production to prevent info leakage.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger('ExceptionFilter');

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        // Determine status code
        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let error = 'Internal Server Error';
        let code: string | undefined;
        let details: any;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object') {
                const resp = exceptionResponse as any;
                message = resp.message || exception.message;
                error = resp.error || 'Error';
                code = resp.code;
                code = resp.code;
                details = resp.details;
            }

            // Custom Message for Rate Limiting
            if (status === HttpStatus.TOO_MANY_REQUESTS) {
                message = 'Terlalu banyak permintaan. Silakan coba lagi nanti.';
                error = 'Too Many Requests';
            }
        } else if (exception instanceof Error) {
            message = exception.message;

            // Handle Prisma errors
            if (exception.constructor.name === 'PrismaClientKnownRequestError') {
                const prismaError = exception as any;

                switch (prismaError.code) {
                    case 'P2002':
                        status = HttpStatus.CONFLICT;
                        error = 'Duplicate Entry';
                        message = 'Data sudah ada. Silakan gunakan data yang berbeda.';
                        code = 'DUPLICATE_ENTRY';
                        break;
                    case 'P2025':
                        status = HttpStatus.NOT_FOUND;
                        error = 'Not Found';
                        message = 'Data tidak ditemukan.';
                        code = 'NOT_FOUND';
                        break;
                    case 'P2003':
                        status = HttpStatus.BAD_REQUEST;
                        error = 'Foreign Key Constraint';
                        message = 'Data terkait dengan data lain dan tidak dapat dihapus.';
                        code = 'FOREIGN_KEY_CONSTRAINT';
                        break;
                    default:
                        code = `PRISMA_${prismaError.code}`;
                }
            }
        }

        // Structured logging
        const logData = {
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            statusCode: status,
            error,
            message,
            code,
            userId: (request as any).user?.userId,
            tenantId: (request as any).user?.tenantId,
            ip: request.ip,
            userAgent: request.get('user-agent'),
        };

        // Log based on severity
        if (status >= 500) {
            this.logger.error(
                `[${status}] ${request.method} ${request.url} - ${message}`,
                exception instanceof Error ? exception.stack : undefined,
            );
            // In production, don't expose internal error details
            if (process.env.NODE_ENV === 'production') {
                message = 'Terjadi kesalahan internal. Silakan coba lagi nanti.';
            }
        } else if (status >= 400) {
            this.logger.warn(`[${status}] ${request.method} ${request.url} - ${message}`);
        }

        // Consistent error response format
        const errorResponse: any = {
            statusCode: status,
            error,
            message,
            timestamp: logData.timestamp,
            path: request.url,
        };

        if (code) {
            errorResponse.code = code;
        }

        if (details && process.env.NODE_ENV !== 'production') {
            errorResponse.details = details;
        }

        response.status(status).json(errorResponse);
    }
}
