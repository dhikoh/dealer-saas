import {
    Controller,
    Post,
    Delete,
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
    Body,
    Param,
    Request,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Upload Controller
 * 
 * Handles file uploads for:
 * - Vehicle images
 * - Customer documents (KTP, KK, etc.)
 * - Receipt images
 * - Payment proofs
 */
@Controller('upload')
export class UploadController {
    constructor(
        private readonly uploadService: UploadService,
        private readonly prisma: PrismaService,
    ) { }

    /**
     * Upload single vehicle image
     */
    @Post('vehicle/:vehicleId')
    @UseInterceptors(FileInterceptor('image'))
    async uploadVehicleImage(
        @UploadedFile() file: Express.Multer.File,
        @Param('vehicleId') vehicleId: string,
        @Request() req: any,
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        // Strict check: Only images allowed for vehicle photos
        if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException('Hanya file gambar yang diperbolehkan');
        }

        // SECURITY: Verify vehicle belongs to tenant
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        const vehicle = await this.prisma.vehicle.findFirst({
            where: { id: vehicleId, tenantId: req.user.tenantId },
        });
        if (!vehicle) {
            throw new NotFoundException('Kendaraan tidak ditemukan');
        }
        return this.uploadService.processUpload(file as any, 'vehicles');
    }

    /**
     * Upload multiple vehicle images
     */
    @Post('vehicle/:vehicleId/multiple')
    @UseInterceptors(FilesInterceptor('images', 10))
    async uploadVehicleImages(
        @UploadedFiles() files: Express.Multer.File[],
        @Param('vehicleId') vehicleId: string,
        @Request() req: any,
    ) {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files uploaded');
        }

        // Strict check: Only images allowed
        for (const file of files) {
            if (!file.mimetype.startsWith('image/')) {
                throw new BadRequestException('Hanya file gambar yang diperbolehkan');
            }
        }

        // SECURITY: Verify vehicle belongs to tenant
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        const vehicle = await this.prisma.vehicle.findFirst({
            where: { id: vehicleId, tenantId: req.user.tenantId },
        });
        if (!vehicle) {
            throw new NotFoundException('Kendaraan tidak ditemukan');
        }
        return {
            success: true,
            files: this.uploadService.processMultipleUploads(files as any[], 'vehicles'),
        };
    }

    /**
     * Upload customer document
     */
    @Post('customer/:customerId/:docType')
    @UseInterceptors(FileInterceptor('document'))
    async uploadCustomerDocument(
        @UploadedFile() file: Express.Multer.File,
        @Param('customerId') customerId: string,
        @Param('docType') docType: string,
        @Request() req: any,
    ) {
        const validDocTypes = ['ktp', 'kk', 'home-proof', 'salary-slip', 'bank-statement', 'business-license'];

        if (!validDocTypes.includes(docType)) {
            throw new BadRequestException(`Invalid document type. Valid types: ${validDocTypes.join(', ')}`);
        }
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        // Customer docs allow PDF, so module-level filter is sufficient

        // SECURITY: Verify customer belongs to tenant
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        const customer = await this.prisma.customer.findFirst({
            where: { id: customerId, tenantId: req.user.tenantId },
        });
        if (!customer) {
            throw new NotFoundException('Customer tidak ditemukan');
        }
        return this.uploadService.processUpload(file as any, `customers/${customerId}`);
    }

    /**
     * Upload payment proof
     */
    @Post('payment/:invoiceId')
    @UseInterceptors(FileInterceptor('proof'))
    uploadPaymentProof(
        @UploadedFile() file: Express.Multer.File,
        @Param('invoiceId') invoiceId: string,
        @Request() req: any,
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        // Strict check: Only images allowed
        if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException('Hanya file gambar yang diperbolehkan');
        }

        req.uploadType = 'payments';

        return this.uploadService.processUpload(file as any, 'payments');
    }

    /**
     * Upload finance/operating cost proof
     */
    @Post('finance/proof')
    @UseInterceptors(FileInterceptor('proof'))
    uploadFinanceProof(
        @UploadedFile() file: Express.Multer.File,
        @Request() req: any,
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        // Strict check: Only images allowed
        if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException('Hanya file gambar yang diperbolehkan');
        }

        return this.uploadService.processUpload(file as any, 'finance');
    }

    /**
     * Upload vehicle cost receipt
     */
    @Post('receipt/:vehicleId')
    @UseInterceptors(FileInterceptor('receipt'))
    uploadReceipt(
        @UploadedFile() file: Express.Multer.File,
        @Param('vehicleId') vehicleId: string,
        @Request() req: any,
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        // Strict check: Only images allowed
        if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException('Hanya file gambar yang diperbolehkan');
        }

        req.uploadType = 'receipts';

        return this.uploadService.processUpload(file as any, 'receipts');
    }

    /**
     * Delete a file
     */
    @Delete()
    deleteFile(@Body('url') url: string) {
        if (!url) {
            throw new BadRequestException('URL is required');
        }

        const deleted = this.uploadService.deleteFile(url);

        return {
            success: deleted,
            message: deleted ? 'File deleted successfully' : 'File not found',
        };
    }
}
