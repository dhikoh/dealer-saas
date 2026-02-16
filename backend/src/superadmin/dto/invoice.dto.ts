import { IsString, IsNumber, IsOptional, IsBoolean, IsDateString, MaxLength, Min } from 'class-validator';

export class CreateInvoiceDto {
    @IsString()
    @MaxLength(100)
    tenantId: string;

    @IsNumber()
    @Min(0)
    amount: number;

    @IsDateString()
    dueDate: string;

    @IsOptional()
    @IsString()
    @MaxLength(5000, { message: 'Item deskripsi maksimal 5000 karakter' })
    items?: string;
}

export class VerifyInvoiceDto {
    @IsBoolean()
    approved: boolean;
}
