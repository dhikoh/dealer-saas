import { Module } from '@nestjs/common';
import { DealerGroupService } from './dealer-group.service';
import { DealerGroupController } from './dealer-group.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [DealerGroupController],
    providers: [DealerGroupService],
    exports: [DealerGroupService],
})
export class DealerGroupModule { }
