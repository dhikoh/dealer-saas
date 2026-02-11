
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PlanService } from './plan.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('plans')
export class PlanController {
    constructor(private readonly planService: PlanService) { }

    // Public endpoint for Landing Page
    // TODO: Add Public decorator if implemented, or just keep it open if AuthGuard is global
    @Get('public')
    async getPublicPlans() {
        return this.planService.findAll();
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPERADMIN')
    async findAll() {
        return this.planService.findAll();
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPERADMIN')
    async findOne(@Param('id') id: string) {
        return this.planService.findOne(id);
    }
}
