import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreatePaymentMethodDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100, { message: 'Provider maksimal 100 karakter' })
    provider: string; // BCA, MANDIRI, BRI, BNI, QRIS, EWALLET

    @IsString()
    @IsNotEmpty()
    @MaxLength(255, { message: 'Nama akun maksimal 255 karakter' })
    accountName: string; // a.n PT OTOHUB INDONESIA

    @IsString()
    @IsNotEmpty()
    @MaxLength(100, { message: 'Nomor akun maksimal 100 karakter' })
    accountNumber: string; // 1234567890

    @IsString()
    @IsOptional()
    @MaxLength(500, { message: 'Deskripsi maksimal 500 karakter' })
    description?: string;

    @IsString()
    @IsOptional()
    @MaxLength(500, { message: 'URL logo maksimal 500 karakter' })
    logo?: string;

    @IsString()
    @IsOptional()
    @MaxLength(2000, { message: 'Instruksi maksimal 2000 karakter' })
    instructions?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdatePaymentMethodDto {
    @IsString()
    @IsOptional()
    @MaxLength(100, { message: 'Provider maksimal 100 karakter' })
    provider?: string;

    @IsString()
    @IsOptional()
    @MaxLength(255, { message: 'Nama akun maksimal 255 karakter' })
    accountName?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100, { message: 'Nomor akun maksimal 100 karakter' })
    accountNumber?: string;

    @IsString()
    @IsOptional()
    @MaxLength(500, { message: 'Deskripsi maksimal 500 karakter' })
    description?: string;

    @IsString()
    @IsOptional()
    @MaxLength(500, { message: 'URL logo maksimal 500 karakter' })
    logo?: string;

    @IsString()
    @IsOptional()
    @MaxLength(2000, { message: 'Instruksi maksimal 2000 karakter' })
    instructions?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
