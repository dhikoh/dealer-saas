import { IsString, IsEmail, MaxLength, MinLength, Matches, IsOptional } from 'class-validator';

export class CreateAdminStaffDto {
    @IsString()
    @MaxLength(255, { message: 'Nama maksimal 255 karakter' })
    name: string;

    @IsEmail()
    @MaxLength(255)
    email: string;

    @IsString()
    @MinLength(8, { message: 'Password minimal 8 karakter' })
    @MaxLength(128, { message: 'Password maksimal 128 karakter' })
    @Matches(/[A-Z]/, { message: 'Password harus mengandung huruf besar' })
    @Matches(/[a-z]/, { message: 'Password harus mengandung huruf kecil' })
    @Matches(/\d/, { message: 'Password harus mengandung angka' })
    password: string;

    @IsOptional()
    @IsString()
    @MaxLength(20, { message: 'Nomor telepon maksimal 20 karakter' })
    phone?: string;
}
