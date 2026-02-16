import { IsString, IsNotEmpty, IsOptional, IsEmail, Matches, MaxLength } from 'class-validator';

export class CreateCustomerDto {
    @IsString({ message: 'Nomor KTP harus berupa teks' })
    @IsNotEmpty({ message: 'Nomor KTP wajib diisi' })
    @Matches(/^\d{16}$/, { message: 'Nomor KTP harus 16 digit angka' })
    ktpNumber: string;

    @IsString({ message: 'Nama harus berupa teks' })
    @IsNotEmpty({ message: 'Nama wajib diisi' })
    @MaxLength(255, { message: 'Nama maksimal 255 karakter' })
    name: string;

    @IsString({ message: 'Nomor telepon harus berupa teks' })
    @IsNotEmpty({ message: 'Nomor telepon wajib diisi' })
    @MaxLength(20, { message: 'Nomor telepon maksimal 20 karakter' })
    phone: string;

    @IsOptional()
    @IsEmail({}, { message: 'Format email tidak valid' })
    email?: string;

    @IsOptional()
    @IsString({ message: 'Alamat harus berupa teks' })
    @MaxLength(500, { message: 'Alamat maksimal 500 karakter' })
    address?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Path gambar KTP maksimal 500 karakter' })
    ktpImage?: string;
}
