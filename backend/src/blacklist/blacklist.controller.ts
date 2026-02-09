import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    Request,
} from '@nestjs/common';
import { BlacklistService } from './blacklist.service';

// Protected by global JwtAuthGuard
@Controller('blacklist')
export class BlacklistController {
    constructor(private readonly blacklistService: BlacklistService) { }

    // ==================== TENANT-SPECIFIC (Protected) ====================

    @Get()
    findAll(@Request() req) {
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
        return this.blacklistService.create(req.user.tenantId, data);
    }

    @Delete(':ktp')
    delete(@Param('ktp') ktpNumber: string, @Request() req) {
        return this.blacklistService.delete(ktpNumber, req.user.tenantId);
    }

    // ==================== CROSS-TENANT CHECK (For all registered dealers) ====================

    @Get('check/:ktp')
    checkBlacklist(@Param('ktp') ktpNumber: string) {
        return this.blacklistService.checkBlacklist(ktpNumber);
    }
}

