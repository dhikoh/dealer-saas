
import { Controller, Post, Body, Get, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { DealerGroupService } from './dealer-group.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('dealer-groups')
@UseGuards(JwtAuthGuard)
export class DealerGroupController {
    constructor(private readonly dealerGroupService: DealerGroupService) { }

    @Post()
    async create(@Request() req, @Body('name') name: string) {
        return this.dealerGroupService.createGroup(req.user.id, name);
    }

    @Post('join')
    async join(@Request() req, @Body('code') code: string) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.dealerGroupService.joinGroup(req.user.tenantId, code);
    }

    @Get('my')
    async getMyGroup(@Request() req) {
        const group = await this.dealerGroupService.getMyGroup(req.user.id);
        return { group };
    }

    // Alias for Mobile App compatibility
    @Get('my-group')
    async getMyGroupMobile(@Request() req) {
        const group = await this.dealerGroupService.getMyGroup(req.user.id);
        return { group };
    }

    @Post('kick')
    async kickMember(@Request() req, @Body('memberTenantId') memberTenantId: string) {
        return this.dealerGroupService.removeMember(req.user.id, memberTenantId);
    }
}
