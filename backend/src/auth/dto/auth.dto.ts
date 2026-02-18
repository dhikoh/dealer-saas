import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, Matches } from 'class-validator';

export class LoginDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    email: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    password: string;
}

export class VerifyEmailDto {
    @IsEmail({}, { message: 'Format email tidak valid' })
    @MaxLength(255)
    email: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(10, { message: 'Kode OTP maksimal 10 karakter' })
    code: string;
}

export class ResendOtpDto {
    @IsEmail({}, { message: 'Format email tidak valid' })
    @MaxLength(255)
    email: string;
}

export class OnboardingDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(255, { message: 'Nama lengkap maksimal 255 karakter' })
    fullName: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(20, { message: 'Nomor telepon maksimal 20 karakter' })
    phone: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(255, { message: 'Nama dealer maksimal 255 karakter' })
    dealerName: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(30)
    birthDate: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(500, { message: 'Alamat domisili maksimal 500 karakter' })
    domicileAddress: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(500, { message: 'Alamat kantor maksimal 500 karakter' })
    officeAddress: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(10, { message: 'Bahasa maksimal 10 karakter' })
    language: string;
}

export class ChangePasswordDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    currentPassword: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(8, { message: 'Password baru minimal 8 karakter' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message: 'Password harus mengandung huruf besar, huruf kecil, dan angka',
    })
    newPassword: string;
}

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'Nama maksimal 255 karakter' })
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20, { message: 'Nomor telepon maksimal 20 karakter' })
    phone?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Alamat maksimal 500 karakter' })
    address?: string;
}

export class GoogleLoginDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(5000, { message: 'Google credential terlalu panjang' })
    credential: string;
}

export class ForgotPasswordDto {
    @IsEmail({}, { message: 'Format email tidak valid' })
    @MaxLength(255)
    email: string;
}

export class ResetPasswordDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(1000, { message: 'Token terlalu panjang' })
    token: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(8, { message: 'Password baru minimal 8 karakter' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message: 'Password harus mengandung huruf besar, huruf kecil, dan angka',
    })
    newPassword: string;
}

export class RefreshTokenDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(1000)
    refresh_token: string;
}

export class LogoutDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(1000)
    refresh_token: string;
}
