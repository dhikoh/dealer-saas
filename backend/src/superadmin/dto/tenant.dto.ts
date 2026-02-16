import { IsString, IsEmail, IsOptional, IsNumber, Min, MaxLength } from 'class-validator';

export class CreateTenantDto {
    @IsString()
    @MaxLength(255, { message: 'Nama dealer maksimal 255 karakter' })
    name: string;

    @IsEmail()
    @MaxLength(255)
    email: string;

    @IsOptional()
    @IsString()
    @MaxLength(20, { message: 'Nomor telepon maksimal 20 karakter' })
    phone?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Alamat maksimal 500 karakter' })
    address?: string;

    @IsString()
    @MaxLength(50, { message: 'Plan tier maksimal 50 karakter' })
    planTier: string;

    @IsNumber()
    @Min(1)
    billingMonths: number;

    @IsString()
    @MaxLength(255, { message: 'Nama owner maksimal 255 karakter' })
    ownerName: string;

    @IsEmail()
    @MaxLength(255)
    ownerEmail: string;

    @IsString()
    @MaxLength(128, { message: 'Password maksimal 128 karakter' })
    ownerPassword: string;
}

export class UpdateTenantDto {
    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'Nama dealer maksimal 255 karakter' })
    name?: string;

    @IsOptional()
    @IsEmail()
    @MaxLength(255)
    email?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20, { message: 'Nomor telepon maksimal 20 karakter' })
    phone?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Alamat maksimal 500 karakter' })
    address?: string;
}

export class UpdateTenantStatusDto {
    @IsString()
    @MaxLength(20)
    status: string;
}

export class SuspendTenantDto {
    @IsOptional()
    @IsString()
    @MaxLength(1000, { message: 'Alasan suspend maksimal 1000 karakter' })
    reason?: string;
}

export class UpgradeTenantPlanDto {
    @IsString()
    @MaxLength(50, { message: 'Plan tier maksimal 50 karakter' })
    planTier: string;
}

export class DirectPlanChangeDto {
    @IsString()
    @MaxLength(50, { message: 'Plan tier maksimal 50 karakter' })
    planTier: string;

    @IsNumber()
    @Min(1)
    billingMonths: number;
}
