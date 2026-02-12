import { Module } from '@nestjs/common';
import { ReminderController } from './reminder.controller';
import { ReminderService } from './reminder.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
    imports: [PrismaModule, NotificationModule],
    controllers: [ReminderController],
    providers: [ReminderService],
    exports: [ReminderService],
})
export class ReminderModule { }
