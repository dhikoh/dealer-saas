
import { Controller, Get, Param, UseGuards, Patch, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { PlanService } from './plan.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Controller('plans')
export class PlanController {
    constructor(private readonly planService: PlanService) { }

    // Public endpoint for Landing Page — no auth required
    @Public()
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

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPERADMIN')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async update(@Param('id') id: string, @Body() updatePlanDto: UpdatePlanDto) {
        return this.planService.update(id, updatePlanDto);
    }
}
