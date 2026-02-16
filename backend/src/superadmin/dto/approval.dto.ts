import { IsString, IsBoolean, IsOptional, MaxLength } from 'class-validator';

export class CreateApprovalRequestDto {
    @IsString()
    @MaxLength(50, { message: 'Tipe request maksimal 50 karakter' })
    type: string;

    @IsString()
    @MaxLength(5000, { message: 'Payload maksimal 5000 karakter' })
    payload: string;
}

export class ProcessApprovalRequestDto {
    @IsBoolean()
    approved: boolean;

    @IsOptional()
    @IsString()
    @MaxLength(1000, { message: 'Catatan maksimal 1000 karakter' })
    note?: string;
}
