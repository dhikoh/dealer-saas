import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';
import { PrismaModule } from '../prisma/prisma.module';

import { UploadModule } from '../upload/upload.module';

@Module({
    imports: [PrismaModule, UploadModule],
    controllers: [PdfController],
    providers: [PdfService],
    exports: [PdfService],
})
export class PdfModule { }
