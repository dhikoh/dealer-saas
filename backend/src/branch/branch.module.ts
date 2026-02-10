
import { Module } from '@nestjs/common';
import { BranchService } from './branch.service';
import { BranchController } from './branch.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    controllers: [BranchController],
    providers: [BranchService, PrismaService],
    exports: [BranchService],
})
export class BranchModule { }
