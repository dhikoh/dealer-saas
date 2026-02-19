
import { Module } from '@nestjs/common';
import { SuperadminController } from './superadmin.controller';
import { SuperadminService } from './superadmin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantModule } from '../tenant/tenant.module';
import { PublicModule } from '../public/public.module';
import { BillingModule } from '../billing/billing.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
    imports: [PrismaModule, TenantModule, PublicModule, BillingModule, NotificationModule],
    controllers: [SuperadminController],
    providers: [SuperadminService],
})
export class SuperadminModule { }
