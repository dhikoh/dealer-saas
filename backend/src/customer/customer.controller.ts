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

@Controller('customers')
export class CustomerController {
    constructor(private readonly customerService: CustomerService) { }

    @Get()
    findAll(@Request() req, @Query('search') search?: string) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.customerService.findAll(req.user.tenantId, search);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.customerService.findOne(id, req.user.tenantId);
    }

    @Get(':id/pdf')
    async downloadPdf(@Param('id') id: string, @Request() req, @Res() res: Response) {
        const buffer = await this.customerService.generatePdf(id, req.user.tenantId);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=customer-${id}.pdf`,
            'Content-Length': buffer.length,
        });

        res.end(buffer);
    }

    @Get(':id/documents')
    getDocumentStatus(@Param('id') id: string, @Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.customerService.getDocumentStatus(id, req.user.tenantId);
    }

    @Post()
    create(@Body() data: CreateCustomerDto, @Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.customerService.create(req.user.tenantId, data);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() data: UpdateCustomerDto, @Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.customerService.update(id, req.user.tenantId, data);
    }

    @Delete(':id')
    delete(@Param('id') id: string, @Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.customerService.delete(id, req.user.tenantId);
    }
}
