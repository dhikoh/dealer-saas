import { IsNumber, IsNotEmpty, IsDateString, IsOptional, IsString, IsIn, Min } from 'class-validator';

export class AddPaymentDto {
    @IsNumber({}, { message: 'Bulan cicilan harus berupa angka' })
    @Min(1, { message: 'Bulan cicilan minimal 1' })
    month: number;

    @IsNumber({}, { message: 'Jumlah pembayaran harus berupa angka' })
    @Min(0, { message: 'Jumlah pembayaran tidak boleh negatif' })
    amount: number;

    @IsDateString({}, { message: 'Format tanggal pembayaran tidak valid' })
    @IsNotEmpty({ message: 'Tanggal pembayaran wajib diisi' })
    paidAt: string;

    @IsOptional()
    @IsString()
    @IsIn(['PAID', 'LATE'], { message: 'Status pembayaran harus PAID atau LATE' })
    status?: string;
}
