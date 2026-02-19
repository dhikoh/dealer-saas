import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BillingModule } from '../billing/billing.module';

@Module({
    imports: [PrismaModule, BillingModule],
    controllers: [CustomerController],
    providers: [CustomerService],
    exports: [CustomerService],
})
export class CustomerModule { }
