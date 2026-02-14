import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';

export class CreateAdminStaffDto {
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    password: string;

    @IsOptional()
    @IsString()
    phone?: string;
}
