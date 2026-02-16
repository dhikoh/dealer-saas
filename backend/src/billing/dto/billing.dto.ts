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

/** POST /billing/my-invoices/:id/upload-proof */
export class UploadPaymentProofDto {
    @IsNotEmpty({ message: 'URL bukti pembayaran wajib diisi' })
    @IsString()
    @MaxLength(500, { message: 'URL bukti maksimal 500 karakter' })
    proofUrl: string;
}
