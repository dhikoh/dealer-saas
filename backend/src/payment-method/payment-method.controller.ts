import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PaymentMethodService } from './payment-method.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';

@Controller('payment-methods')
export class PaymentMethodController {
    constructor(private readonly service: PaymentMethodService) { }

    // ==================== PUBLIC / TENANT (Authenticated) ====================

    @Get('active')
    async getActive() {
        // Tenants need this to pay bills
        return this.service.getActiveMethods();
    }

    // ==================== SUPERADMIN ====================

    @Get('admin/all')
    @UseGuards(RolesGuard)
    @Roles('SUPERADMIN')
    async getAll() {
        return this.service.getAllMethods();
    }

    @Post('admin')
    @UseGuards(RolesGuard)
    @Roles('SUPERADMIN')
    async create(@Body() body: any) {
        return this.service.createMethod(body);
    }

    @Patch('admin/:id')
    @UseGuards(RolesGuard)
    @Roles('SUPERADMIN')
    async update(@Param('id') id: string, @Body() body: any) {
        return this.service.updateMethod(id, body);
    }

    @Delete('admin/:id')
    @UseGuards(RolesGuard)
    @Roles('SUPERADMIN')
    async delete(@Param('id') id: string) {
        return this.service.deleteMethod(id);
    }

    @Patch('admin/:id/toggle')
    @UseGuards(RolesGuard)
    @Roles('SUPERADMIN')
    async toggle(@Param('id') id: string, @Body('isActive') isActive: boolean) {
        return this.service.toggleActive(id, isActive);
    }
}
