import { IsBoolean, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** PATCH /billing/admin/invoice/:id/verify */
export class VerifyPaymentDto {
    @IsNotEmpty()
    @IsBoolean({ message: 'approved harus berupa boolean' })
    approved: boolean;

    @IsNotEmpty()
    @IsString()
    @MaxLength(255, { message: 'verifiedBy maksimal 255 karakter' })
    verifiedBy: string;
}

// UploadPaymentProofDto removed — now using Multer file upload directly
