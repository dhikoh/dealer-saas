import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/** POST /blacklist */
export class CreateBlacklistDto {
    @IsNotEmpty({ message: 'Nomor KTP wajib diisi' })
    @IsString()
    @MaxLength(20, { message: 'Nomor KTP maksimal 20 karakter' })
    ktpNumber: string;

    @IsNotEmpty({ message: 'Nama customer wajib diisi' })
    @IsString()
    @MaxLength(255, { message: 'Nama customer maksimal 255 karakter' })
    customerName: string;

    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Alamat maksimal 500 karakter' })
    customerAddress?: string;

    @IsNotEmpty({ message: 'Alasan wajib diisi' })
    @IsString()
    @MaxLength(1000, { message: 'Alasan maksimal 1000 karakter' })
    reason: string;
}
