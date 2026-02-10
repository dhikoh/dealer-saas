import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, Min, IsIn } from 'class-validator';

export class AddCostDto {
    @IsString({ message: 'Tipe biaya harus berupa teks' })
    @IsNotEmpty({ message: 'Tipe biaya wajib diisi' })
    @IsIn(['PURCHASE', 'MAINTENANCE', 'TAX', 'INSURANCE', 'OTHER'], { message: 'Tipe biaya tidak valid' })
    costType: string;

    @IsNumber({}, { message: 'Jumlah biaya harus berupa angka' })
    @Min(0, { message: 'Jumlah biaya tidak boleh negatif' })
    amount: number;

    @IsOptional()
    @IsString({ message: 'Deskripsi harus berupa teks' })
    description?: string;

    @IsDateString({}, { message: 'Format tanggal tidak valid' })
    @IsNotEmpty({ message: 'Tanggal wajib diisi' })
    date: string;

    @IsOptional()
    @IsString()
    receiptImage?: string;
}
