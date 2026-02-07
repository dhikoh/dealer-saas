
import { Module } from '@nestjs/common';
import { SuperadminController } from './superadmin.controller';
import { SuperadminService } from './superadmin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantModule } from '../tenant/tenant.module';

@Module({
    imports: [PrismaModule, TenantModule],
    controllers: [SuperadminController],
    providers: [SuperadminService],
})
export class SuperadminModule { }
