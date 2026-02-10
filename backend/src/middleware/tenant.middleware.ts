import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const tenantId = req.headers['x-tenant-id'] as string;

        // Attach tenantId from header (if present) for non-JWT flows
        // The actual tenantId is extracted from JWT token in guards,
        // so this middleware just forwards the header value.
        req['tenantId'] = tenantId;

        next();
    }
}
