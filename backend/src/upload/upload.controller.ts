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
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

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
    constructor(private readonly uploadService: UploadService) { }

    /**
     * Upload single vehicle image
     */
    @Post('vehicle/:vehicleId')
    @UseInterceptors(FileInterceptor('image'))
    uploadVehicleImage(
        @UploadedFile() file: Express.Multer.File,
        @Param('vehicleId') vehicleId: string,
        @Request() req: any,
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        req.uploadType = 'vehicles';

        return this.uploadService.processUpload(file as any, 'vehicles');
    }

    /**
     * Upload multiple vehicle images
     */
    @Post('vehicle/:vehicleId/multiple')
    @UseInterceptors(FilesInterceptor('images', 10))
    uploadVehicleImages(
        @UploadedFiles() files: Express.Multer.File[],
        @Param('vehicleId') vehicleId: string,
        @Request() req: any,
    ) {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files uploaded');
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
    uploadCustomerDocument(
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

        req.uploadType = `customers/${customerId}`;

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

        req.uploadType = 'payments';

        return this.uploadService.processUpload(file as any, 'payments');
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
