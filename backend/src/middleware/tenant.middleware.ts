import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const tenantId = req.headers['x-tenant-id'] as string;

        if (!tenantId) {
            // For public routes (like login/register), we might allow missing tenantId
            // But for protected routes, it's mandatory.
            // For Phase 1, we just log it or allow it for now until Auth is ready.
            // throw new BadRequestException('X-Tenant-ID header is missing');
        }

        // Attach to request object for use in Guards/Interceptors
        req['tenantId'] = tenantId;

        next();
    }
}
