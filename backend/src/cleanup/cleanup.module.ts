import { Module } from '@nestjs/common';
import { CleanupService } from './cleanup.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BillingModule } from '../billing/billing.module';

@Module({
    imports: [PrismaModule, BillingModule],
    providers: [CleanupService],
    exports: [CleanupService],
})
export class CleanupModule { }
