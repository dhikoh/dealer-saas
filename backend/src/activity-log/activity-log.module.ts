import { Module, Global } from '@nestjs/common';
import { ActivityLogController } from './activity-log.controller';
import { ActivityLogService } from './activity-log.service';
import { PrismaModule } from '../prisma/prisma.module';

@Global() // Global so all services can inject ActivityLogService
@Module({
    imports: [PrismaModule],
    controllers: [ActivityLogController],
    providers: [ActivityLogService],
    exports: [ActivityLogService],
})
export class ActivityLogModule { }
