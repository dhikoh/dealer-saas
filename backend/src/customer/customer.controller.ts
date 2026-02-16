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
    Res,
    ForbiddenException,
} from '@nestjs/common';
import type { Response } from 'express';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ActiveTenant } from '../common/decorators/active-tenant.decorator';

@Controller('customers')
export class CustomerController {
    constructor(private readonly customerService: CustomerService) { }

    @Get()
    findAll(@ActiveTenant() tenantId: string, @Query('search') search?: string) {
        return this.customerService.findAll(tenantId, search);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @ActiveTenant() tenantId: string) {
        return this.customerService.findOne(id, tenantId);
    }

    @Get(':id/pdf')
    async downloadPdf(@Param('id') id: string, @ActiveTenant() tenantId: string, @Res() res: Response) {
        const buffer = await this.customerService.generatePdf(id, tenantId);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=customer-${id}.pdf`,
            'Content-Length': buffer.length,
        });

        res.end(buffer);
    }

    @Get(':id/documents')
    getDocumentStatus(@Param('id') id: string, @ActiveTenant() tenantId: string) {
        return this.customerService.getDocumentStatus(id, tenantId);
    }

    @Post()
    create(@Body() data: CreateCustomerDto, @ActiveTenant() tenantId: string) {
        return this.customerService.create(tenantId, data);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() data: UpdateCustomerDto, @ActiveTenant() tenantId: string) {
        return this.customerService.update(id, tenantId, data);
    }

    @Delete(':id')
    delete(@Param('id') id: string, @ActiveTenant() tenantId: string) {
        return this.customerService.delete(id, tenantId);
    }
}
