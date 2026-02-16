import { IsEmail, IsNotEmpty, MinLength, IsString, MaxLength, Matches } from 'class-validator';

export class CreateAuthDto {
    @IsEmail({}, { message: 'Format email tidak valid' })
    @IsNotEmpty({ message: 'Email wajib diisi' })
    @MaxLength(255, { message: 'Email maksimal 255 karakter' })
    email: string;

    @IsNotEmpty({ message: 'Password wajib diisi' })
    @MinLength(8, { message: 'Password minimal 8 karakter' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message: 'Password harus mengandung huruf besar, huruf kecil, dan angka',
    })
    password: string;

    @IsNotEmpty({ message: 'Username wajib diisi' })
    @IsString({ message: 'Username harus berupa teks' })
    @MinLength(3, { message: 'Username minimal 3 karakter' })
    @MaxLength(50, { message: 'Username maksimal 50 karakter' })
    username: string;

    // NOTE: 'role' intentionally removed from DTO.
    // Role must never be user-controllable — set server-side in auth.service.ts
}

