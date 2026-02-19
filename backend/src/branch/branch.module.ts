
import { Module } from '@nestjs/common';
import { BranchService } from './branch.service';
import { BranchController } from './branch.controller';
import { PrismaService } from '../prisma/prisma.service';
import { BillingModule } from '../billing/billing.module';

@Module({
    imports: [BillingModule],
    controllers: [BranchController],
    providers: [BranchService, PrismaService],
    exports: [BranchService],
})
export class BranchModule { }
