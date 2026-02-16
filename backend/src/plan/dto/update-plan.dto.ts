
import { IsBoolean, IsInt, IsOptional, IsString, Min, IsObject, MaxLength } from 'class-validator';

export class UpdatePlanDto {
    @IsOptional()
    @IsString()
    @MaxLength(100, { message: 'Nama paket maksimal 100 karakter' })
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000, { message: 'Deskripsi maksimal 1000 karakter' })
    description?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    price?: number;

    @IsOptional()
    @IsInt()
    trialDays?: number;

    @IsOptional()
    @IsInt()
    yearlyDiscount?: number;

    // LIMITS (-1 for unlimited)
    @IsOptional()
    @IsInt()
    maxVehicles?: number;

    @IsOptional()
    @IsInt()
    maxUsers?: number;

    @IsOptional()
    @IsInt()
    maxBranches?: number;

    // GROUP FEATURES
    @IsOptional()
    @IsBoolean()
    canCreateGroup?: boolean;

    @IsOptional()
    @IsInt()
    maxGroupMembers?: number;

    // JSON FEATURES — stored as Json in DB. @IsObject prevents string/number payloads.
    @IsOptional()
    @IsObject()
    features?: Record<string, unknown>;
}
