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

@Controller('vehicles')
export class VehicleController {
    constructor(private readonly vehicleService: VehicleService) { }

    // ==================== VEHICLE CRUD ====================

    @Get()
    async findAll(
        @Request() req,
        @Query('category') category?: string,
        @Query('status') status?: string,
        @Query('condition') condition?: string,
        @Query('branchId') branchId?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');

        if (page && limit) {
            const pageNum = Number(page);
            const limitNum = Number(limit);
            const skip = (pageNum - 1) * limitNum;

            const result = await this.vehicleService.findAll(req.user.tenantId, {
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

        return this.vehicleService.findAll(req.user.tenantId, {
            category,
            status,
            condition,
            branchId,
        });
    }

    @Get('stats')
    getStats(@Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.vehicleService.getStats(req.user.tenantId);
    }

    // ==================== DEALER GROUP FEATURES ====================
    // IMPORTANT: These static routes MUST be above @Get(':id') to prevent
    // NestJS from matching 'group' or 'copy' as a dynamic :id parameter.

    @Get('group/stock')
    findGroupStock(
        @Request() req,
        @Query('category') category?: string,
    ) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.vehicleService.findGroupStock(req.user.tenantId, { category });
    }

    @Post('copy/:id')
    copyVehicle(@Param('id') id: string, @Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.vehicleService.copyVehicle(req.user.tenantId, id);
    }

    // ==================== VEHICLE CRUD (Parameterized) ====================

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.vehicleService.findOne(id, req.user.tenantId);
    }

    @Post()
    create(@Body() data: CreateVehicleDto, @Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.vehicleService.create(req.user.tenantId, data);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() data: UpdateVehicleDto, @Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.vehicleService.update(id, req.user.tenantId, data);
    }

    @Delete(':id')
    delete(@Param('id') id: string, @Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.vehicleService.delete(id, req.user.tenantId);
    }

    // ==================== MASTER DATA ====================

    @Get('brands/list')
    findAllBrands(@Request() req, @Query('category') category?: string) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.vehicleService.findAllBrands(req.user.tenantId, category);
    }

    @Post('brands')
    createBrand(@Body() body: CreateBrandDto, @Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.vehicleService.createBrand(
            req.user.tenantId,
            body.name,
            body.category,
        );
    }

    @Post('models')
    createModel(@Body() body: CreateModelDto, @Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.vehicleService.createModel(
            req.user.tenantId,
            body.brandId,
            body.name,
            body.variants,
        );
    }

    @Post('seed-master-data')
    seedMasterData(@Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.vehicleService.seedDefaultBrands(req.user.tenantId);
    }

    // ==================== VEHICLE COSTS ====================

    @Get(':id/costs')
    getVehicleWithCosts(@Param('id') id: string, @Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.vehicleService.getVehicleWithCosts(id, req.user.tenantId);
    }

    @Post(':id/costs')
    addCost(
        @Param('id') id: string,
        @Body() data: AddCostDto,
        @Request() req,
    ) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.vehicleService.addCost(id, req.user.tenantId, data);
    }

    @Delete('costs/:costId')
    deleteCost(@Param('costId') costId: string, @Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.vehicleService.deleteCost(costId, req.user.tenantId);
    }
}
