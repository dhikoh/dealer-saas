
import { IsBoolean, IsInt, IsOptional, IsString, Min, IsJSON, IsObject } from 'class-validator';

export class UpdatePlanDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
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

    // JSON FEATURES
    @IsOptional()
    features?: any;
}
