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
import { CustomerService } from './customer.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerController {
    constructor(private readonly customerService: CustomerService) { }

    @Get()
    findAll(@Request() req, @Query('search') search?: string) {
        return this.customerService.findAll(req.user.tenantId, search);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        return this.customerService.findOne(id, req.user.tenantId);
    }

    @Get(':id/documents')
    getDocumentStatus(@Param('id') id: string, @Request() req) {
        return this.customerService.getDocumentStatus(id, req.user.tenantId);
    }

    @Post()
    create(@Body() data: any, @Request() req) {
        return this.customerService.create(req.user.tenantId, data);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() data: any, @Request() req) {
        return this.customerService.update(id, req.user.tenantId, data);
    }

    @Delete(':id')
    delete(@Param('id') id: string, @Request() req) {
        return this.customerService.delete(id, req.user.tenantId);
    }
}
