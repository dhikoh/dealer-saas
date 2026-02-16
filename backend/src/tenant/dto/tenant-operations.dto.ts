import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, Matches } from 'class-validator';

/** PATCH /tenant/profile */
export class UpdateTenantProfileDto {
    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'Nama maksimal 255 karakter' })
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Alamat maksimal 500 karakter' })
    address?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20, { message: 'Nomor telepon maksimal 20 karakter' })
    phone?: string;

    @IsOptional()
    @IsEmail({}, { message: 'Format email tidak valid' })
    @MaxLength(255)
    email?: string;
}

/** POST /tenant/staff */
export class CreateStaffDto {
    @IsNotEmpty({ message: 'Nama wajib diisi' })
    @IsString()
    @MaxLength(255, { message: 'Nama maksimal 255 karakter' })
    name: string;

    @IsNotEmpty({ message: 'Email wajib diisi' })
    @IsEmail({}, { message: 'Format email tidak valid' })
    @MaxLength(255)
    email: string;

    @IsNotEmpty({ message: 'Password wajib diisi' })
    @IsString()
    @MinLength(8, { message: 'Password minimal 8 karakter' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message: 'Password harus mengandung huruf besar, huruf kecil, dan angka',
    })
    password: string;

    @IsOptional()
    @IsString()
    @MaxLength(20, { message: 'Nomor telepon maksimal 20 karakter' })
    phone?: string;

    @IsNotEmpty({ message: 'Role wajib diisi' })
    @IsString()
    @MaxLength(50, { message: 'Role maksimal 50 karakter' })
    role: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    branchId?: string;
}

/** PUT /tenant/staff/:id */
export class UpdateStaffDto {
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
    @MaxLength(50, { message: 'Role maksimal 50 karakter' })
    role?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    branchId?: string | null;
}

/** POST /tenant/branches */
export class CreateTenantBranchDto {
    @IsNotEmpty({ message: 'Nama cabang wajib diisi' })
    @IsString()
    @MaxLength(255, { message: 'Nama cabang maksimal 255 karakter' })
    name: string;

    @IsNotEmpty({ message: 'Alamat wajib diisi' })
    @IsString()
    @MaxLength(500, { message: 'Alamat maksimal 500 karakter' })
    address: string;

    @IsOptional()
    @IsString()
    @MaxLength(20, { message: 'Nomor telepon maksimal 20 karakter' })
    phone?: string;
}

/** PUT /tenant/branches/:id */
export class UpdateTenantBranchDto {
    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'Nama cabang maksimal 255 karakter' })
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Alamat maksimal 500 karakter' })
    address?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20, { message: 'Nomor telepon maksimal 20 karakter' })
    phone?: string;
}
