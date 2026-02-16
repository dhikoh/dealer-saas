import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { ActiveTenant } from '../common/decorators/active-tenant.decorator';

// Protected by global JwtAuthGuard + TenantGuard
@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    @Get()
    search(
        @Query('q') query: string,
        @Query('limit') limit: string,
        @ActiveTenant() tenantId: string,
    ) {
        return this.searchService.search(
            tenantId,
            query,
            limit ? parseInt(limit) : 10,
        );
    }
}
