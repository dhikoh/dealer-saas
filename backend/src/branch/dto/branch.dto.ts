import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateBranchDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100, { message: 'Nama cabang maksimal 100 karakter' })
    name: string;

    @IsString()
    @IsOptional()
    @MaxLength(500, { message: 'Alamat maksimal 500 karakter' })
    address?: string;

    @IsString()
    @IsOptional()
    @MaxLength(20, { message: 'Nomor telepon maksimal 20 karakter' })
    phone?: string;
}

export class UpdateBranchDto {
    @IsString()
    @IsOptional()
    @MaxLength(100, { message: 'Nama cabang maksimal 100 karakter' })
    name?: string;

    @IsString()
    @IsOptional()
    @MaxLength(500, { message: 'Alamat maksimal 500 karakter' })
    address?: string;

    @IsString()
    @IsOptional()
    @MaxLength(20, { message: 'Nomor telepon maksimal 20 karakter' })
    phone?: string;
}
