import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { PrismaService } from '../prisma/prisma.service';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [BillingModule],
  controllers: [TenantController],
  providers: [TenantService, PrismaService],
  exports: [TenantService],
})
export class TenantModule { }
