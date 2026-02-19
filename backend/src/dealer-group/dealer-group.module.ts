
import { Module } from '@nestjs/common';
import { DealerGroupService } from './dealer-group.service';
import { DealerGroupController } from './dealer-group.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BillingModule } from '../billing/billing.module';

@Module({
    imports: [PrismaModule, BillingModule],
    controllers: [DealerGroupController],
    providers: [DealerGroupService],
    exports: [DealerGroupService],
})
export class DealerGroupModule { }
