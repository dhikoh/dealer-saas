import { Controller, Get, Query, Request } from '@nestjs/common';
import { SearchService } from './search.service';

// Protected by global JwtAuthGuard
@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    @Get()
    search(
        @Query('q') query: string,
        @Query('limit') limit: string,
        @Request() req,
    ) {
        return this.searchService.search(
            req.user.tenantId,
            query,
            limit ? parseInt(limit) : 10,
        );
    }
}
