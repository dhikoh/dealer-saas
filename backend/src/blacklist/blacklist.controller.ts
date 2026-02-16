import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
} from '@nestjs/common';
import { BlacklistService } from './blacklist.service';
import { ActiveTenant } from '../common/decorators/active-tenant.decorator';
import { CreateBlacklistDto } from './dto/blacklist.dto';

// Protected by global JwtAuthGuard + TenantGuard
@Controller('blacklist')
export class BlacklistController {
    constructor(private readonly blacklistService: BlacklistService) { }

    // ==================== TENANT-SPECIFIC (Protected) ====================

    @Get()
    findAll(@ActiveTenant() tenantId: string) {
        return this.blacklistService.findAllByTenant(tenantId);
    }

    @Post()
    create(
        @ActiveTenant() tenantId: string,
        @Body() data: CreateBlacklistDto,
    ) {
        return this.blacklistService.create(tenantId, data);
    }

    @Delete(':ktp')
    delete(@Param('ktp') ktpNumber: string, @ActiveTenant() tenantId: string) {
        return this.blacklistService.delete(ktpNumber, tenantId);
    }

    // ==================== CROSS-TENANT CHECK (For all registered dealers) ====================

    @Get('check/:ktp')
    checkBlacklist(@Param('ktp') ktpNumber: string) {
        return this.blacklistService.checkBlacklist(ktpNumber);
    }
}
