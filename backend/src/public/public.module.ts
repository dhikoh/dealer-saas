
import { Module } from '@nestjs/common';
import { PublicService } from './public.service';
import { PublicController } from './public.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeyGuard } from '../auth/api-key.guard';

@Module({
    imports: [PrismaModule],
    controllers: [PublicController],
    providers: [PublicService, ApiKeyGuard],
    exports: [PublicService], // Export so SuperadminModule can use it
})
export class PublicModule { }
