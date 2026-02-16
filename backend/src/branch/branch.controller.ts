
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BranchService } from './branch.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { ActiveTenant } from '../common/decorators/active-tenant.decorator';

@ApiTags('Branches')
@ApiBearerAuth()
@Controller('branches')
export class BranchController {
    constructor(private readonly branchService: BranchService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new branch' })
    create(@ActiveTenant() tenantId: string, @Body() createBranchDto: CreateBranchDto) {
        return this.branchService.create(createBranchDto, tenantId);
    }

    @Get()
    @ApiOperation({ summary: 'Get all branches for tenant' })
    findAll(@ActiveTenant() tenantId: string) {
        return this.branchService.findAll(tenantId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get branch details' })
    findOne(@ActiveTenant() tenantId: string, @Param('id') id: string) {
        return this.branchService.findOne(id, tenantId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update branch details' })
    update(@ActiveTenant() tenantId: string, @Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
        return this.branchService.update(id, updateBranchDto, tenantId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a branch' })
    remove(@ActiveTenant() tenantId: string, @Param('id') id: string) {
        return this.branchService.remove(id, tenantId);
    }
}
