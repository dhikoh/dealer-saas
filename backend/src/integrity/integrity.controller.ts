
import { Controller, Get, UseGuards } from '@nestjs/common';
import { IntegrityService } from './integrity.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('superadmin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN')
export class IntegrityController {
    constructor(private readonly integrityService: IntegrityService) { }

    /**
     * On-demand integrity scan.
     * Triggers all 5 diagnostic checks and returns structured JSON.
     */
    @Get('integrity/scan')
    async runScan() {
        return this.integrityService.runDiagnostics();
    }
}
