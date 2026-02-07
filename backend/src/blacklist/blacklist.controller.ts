import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { BlacklistService } from './blacklist.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('blacklist')
export class BlacklistController {
    constructor(private readonly blacklistService: BlacklistService) { }

    // ==================== TENANT-SPECIFIC (Protected) ====================

    @Get()
    @UseGuards(JwtAuthGuard)
    findAll(@Request() req) {
        return this.blacklistService.findAllByTenant(req.user.tenantId);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
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
    @UseGuards(JwtAuthGuard)
    delete(@Param('ktp') ktpNumber: string, @Request() req) {
        return this.blacklistService.delete(ktpNumber, req.user.tenantId);
    }

    // ==================== CROSS-TENANT CHECK (For all registered dealers) ====================

    @Get('check/:ktp')
    @UseGuards(JwtAuthGuard)  // Only registered dealers can access
    checkBlacklist(@Param('ktp') ktpNumber: string) {
        return this.blacklistService.checkBlacklist(ktpNumber);
    }
}
