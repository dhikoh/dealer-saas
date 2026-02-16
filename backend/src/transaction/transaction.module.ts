import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { TransactionDal } from './transaction.dal';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
    imports: [PrismaModule, NotificationModule],
    controllers: [TransactionController],
    providers: [TransactionService, TransactionDal],
    exports: [TransactionService, TransactionDal],
})
export class TransactionModule { }
