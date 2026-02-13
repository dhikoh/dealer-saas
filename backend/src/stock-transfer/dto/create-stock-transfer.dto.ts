import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';

export class CreateStockTransferDto {
    @IsString()
    @IsNotEmpty()
    vehicleId: string;

    @IsString()
    @IsOptional()
    sourceBranchId?: string;

    @IsString()
    @IsOptional()
    targetBranchId?: string;

    @IsString()
    @IsOptional()
    targetTenantId?: string;

    @IsString()
    @IsOptional()
    type?: string; // 'MUTATION' | 'SALE'

    @IsNumber()
    @IsOptional()
    @Min(0)
    price?: number;

    @IsString()
    @IsOptional()
    notes?: string;
}
