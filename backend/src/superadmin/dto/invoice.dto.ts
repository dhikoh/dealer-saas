import { IsString, IsNumber, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class CreateInvoiceDto {
    @IsString()
    tenantId: string;

    @IsNumber()
    amount: number;

    @IsDateString()
    dueDate: string;

    @IsOptional()
    @IsString()
    items?: string;
}

export class VerifyInvoiceDto {
    @IsBoolean()
    approved: boolean;
}
