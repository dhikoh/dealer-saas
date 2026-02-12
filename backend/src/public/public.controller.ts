
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { PublicService } from './public.service';
import { ApiKeyGuard } from '../auth/api-key.guard';

@Controller('api/public')
// @UseGuards(ApiKeyGuard) -- Disabled for Public Access
export class PublicController {
    constructor(private readonly publicService: PublicService) { }

    @Get('vehicles')
    async getVehicles(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('category') category?: string,
        @Query('minPrice') minPrice?: string,
        @Query('maxPrice') maxPrice?: string,
        @Query('make') make?: string,
        @Query('location') location?: string,
        @Query('status') status?: string,
    ) {
        return this.publicService.getMarketplaceVehicles({
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
            category,
            minPrice: minPrice ? parseInt(minPrice) : undefined,
            maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
            make,
            location,
            status: status || 'AVAILABLE',
        });
    }

    @Get('vehicles/:id')
    async getVehicleDetail(@Param('id') id: string) {
        return this.publicService.getMarketplaceVehicleDetail(id);
    }

    @Get('dealers')
    async getDealers(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
    ) {
        return this.publicService.getMarketplaceDealers({
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
            search,
        });
    }

    @Get('blacklist')
    async getBlacklist(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
    ) {
        return this.publicService.getSharedBlacklist({
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
            search,
        });
    }
}
