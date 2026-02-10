import { IsString, IsNotEmpty, IsOptional, IsEmail, Matches } from 'class-validator';

export class CreateCustomerDto {
    @IsString({ message: 'Nomor KTP harus berupa teks' })
    @IsNotEmpty({ message: 'Nomor KTP wajib diisi' })
    @Matches(/^\d{16}$/, { message: 'Nomor KTP harus 16 digit angka' })
    ktpNumber: string;

    @IsString({ message: 'Nama harus berupa teks' })
    @IsNotEmpty({ message: 'Nama wajib diisi' })
    name: string;

    @IsString({ message: 'Nomor telepon harus berupa teks' })
    @IsNotEmpty({ message: 'Nomor telepon wajib diisi' })
    phone: string;

    @IsOptional()
    @IsEmail({}, { message: 'Format email tidak valid' })
    email?: string;

    @IsOptional()
    @IsString({ message: 'Alamat harus berupa teks' })
    address?: string;
}
