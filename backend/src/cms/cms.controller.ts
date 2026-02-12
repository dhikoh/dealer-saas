
import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { CmsService } from './cms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';

@Controller()
export class CmsController {
    constructor(private readonly cmsService: CmsService) { }

    @Public()
    @Get('public/content')
    async getPublicContent() {
        return this.cmsService.getPublicContent();
    }

    @Get('superadmin/cms')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPERADMIN')
    async getContentForAdmin() {
        return this.cmsService.getPublicContent();
    }

    @Patch('superadmin/cms')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPERADMIN')
    async updateContent(@Body() data: any) {
        return this.cmsService.updateContent(data);
    }
}
