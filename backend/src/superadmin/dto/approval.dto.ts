import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateApprovalRequestDto {
    @IsString()
    type: string;

    @IsString()
    payload: string;
}

export class ProcessApprovalRequestDto {
    @IsBoolean()
    approved: boolean;

    @IsOptional()
    @IsString()
    note?: string;
}
