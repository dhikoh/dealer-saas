import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreatePaymentMethodDto {
    @IsString()
    @IsNotEmpty()
    provider: string; // BCA, MANDIRI, BRI, BNI, QRIS, EWALLET

    @IsString()
    @IsNotEmpty()
    accountName: string; // a.n PT OTOHUB INDONESIA

    @IsString()
    @IsNotEmpty()
    accountNumber: string; // 1234567890

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    logo?: string;

    @IsString()
    @IsOptional()
    instructions?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdatePaymentMethodDto {
    @IsString()
    @IsOptional()
    provider?: string;

    @IsString()
    @IsOptional()
    accountName?: string;

    @IsString()
    @IsOptional()
    accountNumber?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    logo?: string;

    @IsString()
    @IsOptional()
    instructions?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
