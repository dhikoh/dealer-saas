
import { Module } from '@nestjs/common';
import { IntegrityService } from './integrity.service';
import { IntegrityController } from './integrity.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [IntegrityController],
    providers: [IntegrityService],
    exports: [IntegrityService],
})
export class IntegrityModule { }
