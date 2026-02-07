import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('vehicles')
@UseGuards(JwtAuthGuard)
export class VehicleController {
    constructor(private readonly vehicleService: VehicleService) { }

    // ==================== VEHICLE CRUD ====================

    @Get()
    findAll(
        @Request() req,
        @Query('category') category?: string,
        @Query('status') status?: string,
        @Query('condition') condition?: string,
        @Query('branchId') branchId?: string,
    ) {
        return this.vehicleService.findAll(req.user.tenantId, {
            category,
            status,
            condition,
            branchId,
        });
    }

    @Get('stats')
    getStats(@Request() req) {
        return this.vehicleService.getStats(req.user.tenantId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        return this.vehicleService.findOne(id, req.user.tenantId);
    }

    @Post()
    create(@Body() data: any, @Request() req) {
        return this.vehicleService.create(req.user.tenantId, data);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() data: any, @Request() req) {
        return this.vehicleService.update(id, req.user.tenantId, data);
    }

    @Delete(':id')
    delete(@Param('id') id: string, @Request() req) {
        return this.vehicleService.delete(id, req.user.tenantId);
    }

    // ==================== MASTER DATA ====================

    @Get('brands/list')
    findAllBrands(@Request() req, @Query('category') category?: string) {
        return this.vehicleService.findAllBrands(req.user.tenantId, category);
    }

    @Post('brands')
    createBrand(
        @Body() body: { name: string; category: string },
        @Request() req,
    ) {
        return this.vehicleService.createBrand(
            req.user.tenantId,
            body.name,
            body.category,
        );
    }

    @Post('models')
    createModel(
        @Body() body: { brandId: string; name: string; variants?: string },
    ) {
        return this.vehicleService.createModel(
            body.brandId,
            body.name,
            body.variants,
        );
    }

    // ==================== VEHICLE COSTS ====================

    @Get(':id/costs')
    getVehicleWithCosts(@Param('id') id: string, @Request() req) {
        return this.vehicleService.getVehicleWithCosts(id, req.user.tenantId);
    }

    @Post(':id/costs')
    addCost(
        @Param('id') id: string,
        @Body() data: {
            costType: string;
            amount: number;
            description?: string;
            date: Date;
            receiptImage?: string;
        },
    ) {
        return this.vehicleService.addCost(id, data);
    }

    @Delete('costs/:costId')
    deleteCost(@Param('costId') costId: string) {
        return this.vehicleService.deleteCost(costId);
    }
}
