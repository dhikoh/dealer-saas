import { IsString, IsEmail, IsOptional, IsEnum, IsNumber, Min, IsBoolean } from 'class-validator';

export class CreateTenantDto {
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsString()
    planTier: string;

    @IsNumber()
    @Min(1)
    billingMonths: number;

    @IsString()
    ownerName: string;

    @IsEmail()
    ownerEmail: string;

    @IsString()
    ownerPassword: string;
}

export class UpdateTenantDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    address?: string;
}

export class UpdateTenantStatusDto {
    @IsEnum(['ACTIVE', 'TRIAL', 'SUSPENDED', 'CANCELLED'])
    status: string;
}

export class SuspendTenantDto {
    @IsOptional()
    @IsString()
    reason?: string;
}

export class UpgradeTenantPlanDto {
    @IsString()
    planTier: string;
}

export class DirectPlanChangeDto {
    @IsString()
    planTier: string;

    @IsNumber()
    @Min(1)
    billingMonths: number;
}
