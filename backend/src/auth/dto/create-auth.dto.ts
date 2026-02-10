import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsString } from 'class-validator';

export class CreateAuthDto {
    @IsEmail({}, { message: 'Format email tidak valid' })
    @IsNotEmpty({ message: 'Email wajib diisi' })
    email: string;

    @IsNotEmpty({ message: 'Password wajib diisi' })
    @MinLength(6, { message: 'Password minimal 6 karakter' })
    password: string;

    @IsNotEmpty({ message: 'Username wajib diisi' })
    @IsString({ message: 'Username harus berupa teks' })
    @MinLength(3, { message: 'Username minimal 3 karakter' })
    username: string;

    @IsOptional()
    @IsString()
    role?: string;
}
