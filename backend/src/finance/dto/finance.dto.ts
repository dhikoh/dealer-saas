import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/** POST /finance/costs */
export class CreateCostDto {
    @IsNotEmpty({ message: 'Nama biaya wajib diisi' })
    @IsString()
    @MaxLength(255, { message: 'Nama biaya maksimal 255 karakter' })
    name: string;

    @IsNotEmpty({ message: 'Jumlah wajib diisi' })
    @IsNumber({}, { message: 'Jumlah harus berupa angka' })
    @Min(0, { message: 'Jumlah tidak boleh negatif' })
    amount: number;

    @IsNotEmpty({ message: 'Kategori wajib diisi' })
    @IsString()
    @MaxLength(100, { message: 'Kategori maksimal 100 karakter' })
    category: string;

    @IsNotEmpty({ message: 'Tanggal wajib diisi' })
    @IsString()
    @MaxLength(30, { message: 'Format tanggal tidak valid' })
    date: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000, { message: 'Catatan maksimal 1000 karakter' })
    note?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'URL bukti maksimal 500 karakter' })
    proofImage?: string;
}

/** PUT /finance/costs/:id */
export class UpdateCostDto {
    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'Nama biaya maksimal 255 karakter' })
    name?: string;

    @IsOptional()
    @IsNumber({}, { message: 'Jumlah harus berupa angka' })
    @Min(0, { message: 'Jumlah tidak boleh negatif' })
    amount?: number;

    @IsOptional()
    @IsString()
    @MaxLength(100, { message: 'Kategori maksimal 100 karakter' })
    category?: string;

    @IsOptional()
    @IsString()
    @MaxLength(30, { message: 'Format tanggal tidak valid' })
    date?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000, { message: 'Catatan maksimal 1000 karakter' })
    note?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'URL bukti maksimal 500 karakter' })
    proofImage?: string;
}
