import { Controller, Post, Body, Get, UseGuards, Request, Delete } from '@nestjs/common';
import { DealerGroupService } from './dealer-group.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('dealer-groups')
@UseGuards(JwtAuthGuard)
export class DealerGroupController {
    constructor(private readonly dealerGroupService: DealerGroupService) { }

    @Post('create')
    create(@Request() req, @Body('name') name: string) {
        const tenantId = req.user.tenantId;
        return this.dealerGroupService.createGroup(tenantId, name);
    }

    @Post('join')
    join(@Request() req, @Body('code') code: string) {
        const tenantId = req.user.tenantId;
        return this.dealerGroupService.joinGroup(tenantId, code);
    }

    @Get('my')
    getMyGroup(@Request() req) {
        const tenantId = req.user.tenantId;
        return this.dealerGroupService.getMyGroup(tenantId);
    }

    @Delete('leave')
    leave(@Request() req) {
        const tenantId = req.user.tenantId;
        return this.dealerGroupService.leaveGroup(tenantId);
    }
}
