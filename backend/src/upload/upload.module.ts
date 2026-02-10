import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { PrismaModule } from '../prisma/prisma.module';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

@Module({
    imports: [
        PrismaModule,
        MulterModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => {
                const uploadDir = configService.get('UPLOAD_DIR', './uploads');

                // Ensure upload directory exists
                if (!existsSync(uploadDir)) {
                    mkdirSync(uploadDir, { recursive: true });
                }

                return {
                    storage: diskStorage({
                        destination: (req, file, cb) => {
                            // Organize uploads by type
                            const type = (req as any).uploadType || 'general';
                            const destPath = join(uploadDir, type);

                            if (!existsSync(destPath)) {
                                mkdirSync(destPath, { recursive: true });
                            }

                            cb(null, destPath);
                        },
                        filename: (req, file, cb) => {
                            // Generate unique filename
                            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                            const ext = extname(file.originalname);
                            cb(null, `${uniqueSuffix}${ext}`);
                        },
                    }),
                    limits: {
                        fileSize: 10 * 1024 * 1024, // 10MB limit
                    },
                    fileFilter: (req, file, cb) => {
                        // Allow images and PDFs
                        const allowedMimes = [
                            'image/jpeg',
                            'image/png',
                            'image/webp',
                            'image/gif',
                            'application/pdf',
                        ];

                        if (allowedMimes.includes(file.mimetype)) {
                            cb(null, true);
                        } else {
                            cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
                        }
                    },
                };
            },
            inject: [ConfigService],
        }),
    ],
    controllers: [UploadController],
    providers: [UploadService],
    exports: [UploadService],
})
export class UploadModule { }
