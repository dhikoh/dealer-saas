import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PdfModule } from '../pdf/pdf.module';
import { NotificationModule } from '../notification/notification.module';
import { SubscriptionStateService } from './subscription-state.service';

@Module({
    imports: [PrismaModule, PdfModule, NotificationModule],
    controllers: [BillingController],
    providers: [BillingService, SubscriptionStateService],
    exports: [BillingService, SubscriptionStateService],
})
export class BillingModule { }
