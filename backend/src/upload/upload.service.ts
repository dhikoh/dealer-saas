import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, unlinkSync, mkdirSync } from 'fs';
import * as path from 'path';
import { join } from 'path';

export interface UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    destination: string;
    filename: string;
    path: string;
    size: number;
}

export interface UploadResult {
    success: boolean;
    url: string;
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
}

@Injectable()
export class UploadService {
    private readonly logger = new Logger(UploadService.name);
    private readonly uploadDir: string;
    private readonly baseUrl: string;

    constructor(private configService: ConfigService) {
        this.uploadDir = this.configService.get('UPLOAD_DIR', './uploads');
        this.baseUrl = this.configService.get('BASE_URL', 'http://localhost:4000');

        // Ensure upload directory exists
        if (!existsSync(this.uploadDir)) {
            mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    /**
     * Process uploaded file and return URL
     */
    processUpload(file: Express.Multer.File, type: string = 'general'): UploadResult {
        // Fix: Use path.relative to get the path relative to the upload root
        // This handles cross-platform path separators correctly
        const relativePath = path.relative(this.uploadDir, file.path).replace(/\\/g, '/');

        // Ensure we don't duplicate the /uploads prefix if it's already in the path
        const url = `/uploads/${relativePath}`;

        return {
            success: true,
            url,
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
        };
    }

    /**
     * Process multiple uploaded files
     */
    processMultipleUploads(files: UploadedFile[], type: string = 'general'): UploadResult[] {
        return files.map(file => this.processUpload(file as any, type));
    }

    /**
     * Delete a file by URL or path
     */
    deleteFile(urlOrPath: string): boolean {
        try {
            // Convert URL to file path
            let filePath = urlOrPath;
            if (urlOrPath.startsWith('/uploads')) {
                filePath = join(this.uploadDir, urlOrPath.replace('/uploads', ''));
            }

            if (existsSync(filePath)) {
                unlinkSync(filePath);
                this.logger.log(`File deleted: ${filePath}`);
                return true;
            }

            this.logger.warn(`File not found for deletion: ${filePath}`);
            return false;
        } catch (error) {
            this.logger.error(`Error deleting file: ${error.message}`);
            return false;
        }
    }

    /**
     * Get full file path from URL
     */
    getFilePath(url: string): string {
        if (url.startsWith('/uploads')) {
            return join(this.uploadDir, url.replace('/uploads', ''));
        }
        return url;
    }

    /**
     * Check if file exists
     */
    fileExists(url: string): boolean {
        const filePath = this.getFilePath(url);
        return existsSync(filePath);
    }

    /**
     * Get upload directory for a specific type
     */
    getTypeDirectory(type: string): string {
        const dir = join(this.uploadDir, type);
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        return dir;
    }
}
