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
    UseGuards,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ActiveTenant } from '../common/decorators/active-tenant.decorator';

/**
 * Upload Controller
 * 
 * Handles file uploads for:
 * - Vehicle images
 * - Customer documents (KTP, KK, etc.)
 * - Receipt images
 * - Payment proofs
 * 
 * NOTE: All Prisma queries are delegated to UploadService.
 * This controller contains ZERO direct Prisma usage (Phase F compliance).
 */
@Controller('upload')
export class UploadController {
    constructor(
        private readonly uploadService: UploadService,
    ) { }

    /**
     * Upload single vehicle image
     */
    @Post('vehicle/:vehicleId')
    @UseInterceptors(FileInterceptor('image'))
    async uploadVehicleImage(
        @UploadedFile() file: Express.Multer.File,
        @Param('vehicleId') vehicleId: string,
        @ActiveTenant() tenantId: string,
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException('Hanya file gambar yang diperbolehkan');
        }

        // SECURITY: Verify vehicle belongs to tenant (via service)
        await this.uploadService.verifyVehicleOwnership(vehicleId, tenantId);
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
        @ActiveTenant() tenantId: string,
    ) {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files uploaded');
        }

        for (const file of files) {
            if (!file.mimetype.startsWith('image/')) {
                throw new BadRequestException('Hanya file gambar yang diperbolehkan');
            }
        }

        // SECURITY: Verify vehicle belongs to tenant (via service)
        await this.uploadService.verifyVehicleOwnership(vehicleId, tenantId);
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
        @ActiveTenant() tenantId: string,
    ) {
        const validDocTypes = ['ktp', 'kk', 'home-proof', 'salary-slip', 'bank-statement', 'business-license'];

        if (!validDocTypes.includes(docType)) {
            throw new BadRequestException(`Invalid document type. Valid types: ${validDocTypes.join(', ')}`);
        }
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        // SECURITY: Verify customer belongs to tenant (via service)
        await this.uploadService.verifyCustomerOwnership(customerId, tenantId);
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
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException('Hanya file gambar yang diperbolehkan');
        }

        return this.uploadService.processUpload(file as any, 'payments');
    }

    /**
     * Upload finance/operating cost proof
     */
    @Post('finance/proof')
    @UseInterceptors(FileInterceptor('proof'))
    uploadFinanceProof(
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
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
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException('Hanya file gambar yang diperbolehkan');
        }

        return this.uploadService.processUpload(file as any, 'receipts');
    }

    /**
     * Delete a file — restricted to OWNER/ADMIN roles
     */
    @Delete()
    @UseGuards(RolesGuard)
    @Roles('OWNER', 'ADMIN')
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

    /**
     * Batch upload vehicle documents (STNK, BPKB, KTP, Tax images)
     * All Prisma operations delegated to UploadService.updateVehicleDocuments
     */
    @Post('vehicle/:vehicleId/documents')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'stnk', maxCount: 1 },
        { name: 'bpkb', maxCount: 1 },
        { name: 'ktp', maxCount: 1 },
        { name: 'tax', maxCount: 1 },
    ]))
    async uploadVehicleDocuments(
        @UploadedFiles() files: {
            stnk?: Express.Multer.File[];
            bpkb?: Express.Multer.File[];
            ktp?: Express.Multer.File[];
            tax?: Express.Multer.File[];
        },
        @Param('vehicleId') vehicleId: string,
        @ActiveTenant() tenantId: string,
    ) {
        if (!files || Object.keys(files).length === 0) {
            throw new BadRequestException('Tidak ada dokumen yang diupload');
        }

        // Process each file and build update data
        const updateData: Record<string, string> = {};
        const results: Record<string, string> = {};

        if (files.stnk?.[0]) {
            const result = this.uploadService.processUpload(files.stnk[0] as any, 'documents');
            updateData.stnkImage = result.url;
            results.stnkImage = result.url;
        }
        if (files.bpkb?.[0]) {
            const result = this.uploadService.processUpload(files.bpkb[0] as any, 'documents');
            updateData.bpkbImage = result.url;
            results.bpkbImage = result.url;
        }
        if (files.ktp?.[0]) {
            const result = this.uploadService.processUpload(files.ktp[0] as any, 'documents');
            updateData.ktpOwnerImage = result.url;
            results.ktpOwnerImage = result.url;
        }
        if (files.tax?.[0]) {
            const result = this.uploadService.processUpload(files.tax[0] as any, 'documents');
            updateData.taxImage = result.url;
            results.taxImage = result.url;
        }

        // Delegate vehicle update to service (no direct Prisma in controller)
        await this.uploadService.updateVehicleDocuments(vehicleId, tenantId, updateData);

        return {
            success: true,
            message: `${Object.keys(results).length} dokumen berhasil diupload`,
            documents: results,
        };
    }
}
