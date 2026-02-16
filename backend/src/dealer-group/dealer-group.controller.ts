
import { Controller, Post, Body, Get, Request } from '@nestjs/common';
import { DealerGroupService } from './dealer-group.service';
import { ActiveTenant } from '../common/decorators/active-tenant.decorator';

@Controller('dealer-groups')
export class DealerGroupController {
    constructor(private readonly dealerGroupService: DealerGroupService) { }

    @Post()
    async create(@Request() req, @Body('name') name: string) {
        return this.dealerGroupService.createGroup(req.user.userId, name);
    }

    @Post('join')
    async join(@ActiveTenant() tenantId: string, @Body('code') code: string) {
        return this.dealerGroupService.joinGroup(tenantId, code);
    }

    @Get('my')
    async getMyGroup(@Request() req) {
        const group = await this.dealerGroupService.getMyGroup(req.user.userId);
        return { group };
    }

    // Alias for Mobile App compatibility
    @Get('my-group')
    async getMyGroupMobile(@Request() req) {
        const group = await this.dealerGroupService.getMyGroup(req.user.userId);
        return { group };
    }

    @Post('leave')
    async leave(@ActiveTenant() tenantId: string, @Request() req) {
        return this.dealerGroupService.leaveGroup(tenantId, req.user.userId);
    }

    @Post('kick')
    async kickMember(@Request() req, @Body('memberTenantId') memberTenantId: string) {
        return this.dealerGroupService.removeMember(req.user.userId, memberTenantId);
    }
}
