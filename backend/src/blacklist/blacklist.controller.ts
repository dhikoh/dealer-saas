import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    Request,
    ForbiddenException,
} from '@nestjs/common';
import { BlacklistService } from './blacklist.service';

// Protected by global JwtAuthGuard
@Controller('blacklist')
export class BlacklistController {
    constructor(private readonly blacklistService: BlacklistService) { }

    // ==================== TENANT-SPECIFIC (Protected) ====================

    @Get()
    findAll(@Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.blacklistService.findAllByTenant(req.user.tenantId);
    }

    @Post()
    create(
        @Request() req,
        @Body() data: {
            ktpNumber: string;
            customerName: string;
            customerAddress?: string;
            reason: string;
        },
    ) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.blacklistService.create(req.user.tenantId, data);
    }

    @Delete(':ktp')
    delete(@Param('ktp') ktpNumber: string, @Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.blacklistService.delete(ktpNumber, req.user.tenantId);
    }

    // ==================== CROSS-TENANT CHECK (For all registered dealers) ====================

    @Get('check/:ktp')
    checkBlacklist(@Param('ktp') ktpNumber: string) {
        return this.blacklistService.checkBlacklist(ktpNumber);
    }
}

