import { Module } from '@nestjs/common';
import { VehicleController } from './vehicle.controller';
import { VehicleService } from './vehicle.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { BillingModule } from '../billing/billing.module';

@Module({
    imports: [PrismaModule, NotificationModule, BillingModule],
    controllers: [VehicleController],
    providers: [VehicleService],
    exports: [VehicleService],
})
export class VehicleModule { }

