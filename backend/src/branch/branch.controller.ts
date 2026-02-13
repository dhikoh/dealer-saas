
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { BranchService } from './branch.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';

@ApiTags('Branches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('branches')
export class BranchController {
    constructor(private readonly branchService: BranchService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new branch' })
    create(@Request() req, @Body() createBranchDto: CreateBranchDto) {
        return this.branchService.create(createBranchDto, req.user.tenantId);
    }

    @Get()
    @ApiOperation({ summary: 'Get all branches for tenant' })
    findAll(@Request() req) {
        return this.branchService.findAll(req.user.tenantId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get branch details' })
    findOne(@Request() req, @Param('id') id: string) {
        return this.branchService.findOne(id, req.user.tenantId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update branch details' })
    update(@Request() req, @Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
        return this.branchService.update(id, updateBranchDto, req.user.tenantId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a branch' })
    remove(@Request() req, @Param('id') id: string) {
        return this.branchService.remove(id, req.user.tenantId);
    }
}
