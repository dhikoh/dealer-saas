
import { Module } from '@nestjs/common';
import { StockTransferService } from './stock-transfer.service';
import { StockTransferController } from './stock-transfer.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    controllers: [StockTransferController],
    providers: [StockTransferService, PrismaService],
    exports: [StockTransferService],
})
export class StockTransferModule { }
