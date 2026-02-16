import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, MaxLength } from 'class-validator';

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
    @MaxLength(20, { message: 'Tipe transfer maksimal 20 karakter' })
    type?: string; // 'MUTATION' | 'SALE'

    @IsNumber()
    @IsOptional()
    @Min(0)
    price?: number;

    @IsString()
    @IsOptional()
    @MaxLength(2000, { message: 'Catatan maksimal 2000 karakter' })
    notes?: string;
}
