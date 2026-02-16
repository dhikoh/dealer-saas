import { IsString, IsOptional, IsEmail, MaxLength } from 'class-validator';

export class CreateTenantDto {
    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'Nama dealer maksimal 255 karakter' })
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Alamat maksimal 500 karakter' })
    address?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20, { message: 'Nomor telepon maksimal 20 karakter' })
    phone?: string;

    @IsOptional()
    @IsEmail({}, { message: 'Format email tidak valid' })
    @MaxLength(255, { message: 'Email maksimal 255 karakter' })
    email?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000, { message: 'Deskripsi maksimal 1000 karakter' })
    description?: string;
}
