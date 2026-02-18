import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    Request,
    ForbiddenException,
} from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateModelDto } from './dto/create-model.dto';
import { AddCostDto } from './dto/add-cost.dto';
import { ActiveTenant } from '../common/decorators/active-tenant.decorator';

@Controller('vehicles')
export class VehicleController {
    constructor(private readonly vehicleService: VehicleService) { }

    // ==================== VEHICLE CRUD ====================

    @Get()
    async findAll(
        @ActiveTenant() tenantId: string,
        @Query('category') category?: string,
        @Query('status') status?: string,
        @Query('condition') condition?: string,
        @Query('branchId') branchId?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        if (page && limit) {
            const pageNum = Number(page);
            const limitNum = Number(limit);
            const skip = (pageNum - 1) * limitNum;

            const result = await this.vehicleService.findAll(tenantId, {
                category, status, condition, branchId
            }, { skip, take: limitNum });

            // If pagination was used, result is { data, total }
            if ('total' in result) {
                return {
                    data: result.data,
                    meta: {
                        total: result.total,
                        page: pageNum,
                        last_page: Math.ceil(result.total / limitNum)
                    }
                };
            }
        }

        return this.vehicleService.findAll(tenantId, {
            category,
            status,
            condition,
            branchId,
        });
    }

    @Get('stats')
    getStats(@ActiveTenant() tenantId: string) {
        return this.vehicleService.getStats(tenantId);
    }

    // ==================== DEALER GROUP FEATURES ====================
    // IMPORTANT: These static routes MUST be above @Get(':id') to prevent
    // NestJS from matching 'group' or 'copy' as a dynamic :id parameter.

    @Get('group/stock')
    findGroupStock(
        @ActiveTenant() tenantId: string,
        @Query('category') category?: string,
    ) {
        return this.vehicleService.findGroupStock(tenantId, { category });
    }

    @Post('copy/:id')
    copyVehicle(@Param('id') id: string, @ActiveTenant() tenantId: string) {
        return this.vehicleService.copyVehicle(tenantId, id);
    }

    // ==================== VEHICLE CRUD (Parameterized) ====================

    @Get(':id')
    findOne(@Param('id') id: string, @ActiveTenant() tenantId: string) {
        return this.vehicleService.findOne(id, tenantId);
    }

    @Post()
    create(@Body() data: CreateVehicleDto, @ActiveTenant() tenantId: string) {
        return this.vehicleService.create(tenantId, data);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() data: UpdateVehicleDto, @ActiveTenant() tenantId: string) {
        return this.vehicleService.update(id, tenantId, data);
    }

    @Delete(':id')
    delete(@Param('id') id: string, @ActiveTenant() tenantId: string) {
        return this.vehicleService.delete(id, tenantId);
    }

    // ==================== MASTER DATA ====================

    @Get('brands/list')
    findAllBrands(@ActiveTenant() tenantId: string, @Query('category') category?: string) {
        return this.vehicleService.findAllBrands(tenantId, category);
    }

    @Post('brands')
    createBrand(@Body() body: CreateBrandDto, @ActiveTenant() tenantId: string) {
        return this.vehicleService.createBrand(
            tenantId,
            body.name,
            body.category,
        );
    }

    @Put('brands/:brandId')
    updateBrand(
        @Param('brandId') brandId: string,
        @Body() body: { name?: string; category?: string },
        @ActiveTenant() tenantId: string,
    ) {
        return this.vehicleService.updateBrand(brandId, tenantId, body);
    }

    @Delete('brands/:brandId')
    deleteBrand(@Param('brandId') brandId: string, @ActiveTenant() tenantId: string) {
        return this.vehicleService.deleteBrand(brandId, tenantId);
    }

    @Post('models')
    createModel(@Body() body: CreateModelDto, @ActiveTenant() tenantId: string) {
        return this.vehicleService.createModel(
            tenantId,
            body.brandId,
            body.name,
            body.variants,
        );
    }

    @Put('models/:modelId')
    updateModel(
        @Param('modelId') modelId: string,
        @Body() body: { name?: string; variants?: string },
        @ActiveTenant() tenantId: string,
    ) {
        return this.vehicleService.updateModel(modelId, tenantId, body);
    }

    @Delete('models/:modelId')
    deleteModel(@Param('modelId') modelId: string, @ActiveTenant() tenantId: string) {
        return this.vehicleService.deleteModel(modelId, tenantId);
    }

    @Post('seed-master-data')
    seedMasterData(@ActiveTenant() tenantId: string) {
        return this.vehicleService.seedDefaultBrands(tenantId);
    }

    // ==================== VEHICLE COSTS ====================

    @Get(':id/costs')
    getVehicleWithCosts(@Param('id') id: string, @ActiveTenant() tenantId: string) {
        return this.vehicleService.getVehicleWithCosts(id, tenantId);
    }

    @Post(':id/costs')
    addCost(
        @Param('id') id: string,
        @Body() data: AddCostDto,
        @ActiveTenant() tenantId: string,
    ) {
        return this.vehicleService.addCost(id, tenantId, data);
    }

    @Delete('costs/:costId')
    deleteCost(@Param('costId') costId: string, @ActiveTenant() tenantId: string) {
        return this.vehicleService.deleteCost(costId, tenantId);
    }
}
