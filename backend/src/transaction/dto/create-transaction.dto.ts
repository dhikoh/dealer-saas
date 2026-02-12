import { IsString, IsNotEmpty, IsNumber, IsOptional, IsIn, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CreditDataDto {
    @IsString({ message: 'Tipe kredit harus berupa teks' })
    @IsNotEmpty({ message: 'Tipe kredit wajib diisi' })
    @IsIn(['LEASING', 'DEALER_CREDIT', 'DEALER_TO_LEASING'], { message: 'Tipe kredit tidak valid' })
    creditType: string;

    @IsOptional()
    @IsString({ message: 'Nama perusahaan leasing harus berupa teks' })
    leasingCompany?: string;

    @IsNumber({}, { message: 'Uang muka harus berupa angka' })
    @Min(0, { message: 'Uang muka tidak boleh negatif' })
    downPayment: number;

    @IsNumber({}, { message: 'Suku bunga harus berupa angka' })
    @Min(0, { message: 'Suku bunga tidak boleh negatif' })
    interestRate: number;

    @IsNumber({}, { message: 'Tenor harus berupa angka' })
    @Min(1, { message: 'Tenor minimal 1 bulan' })
    tenorMonths: number;
}

export class CreateTransactionDto {
    @IsString({ message: 'Tipe transaksi harus berupa teks' })
    @IsNotEmpty({ message: 'Tipe transaksi wajib diisi' })
    @IsIn(['SALE', 'PURCHASE'], { message: 'Tipe transaksi harus SALE atau PURCHASE' })
    type: string;

    @IsString({ message: 'ID kendaraan harus berupa teks' })
    @IsNotEmpty({ message: 'ID kendaraan wajib diisi' })
    vehicleId: string;

    @IsString({ message: 'ID pelanggan harus berupa teks' })
    @IsNotEmpty({ message: 'ID pelanggan wajib diisi' })
    customerId: string;

    @IsString({ message: 'Tipe pembayaran harus berupa teks' })
    @IsNotEmpty({ message: 'Tipe pembayaran wajib diisi' })
    @IsIn(['CASH', 'CREDIT'], { message: 'Tipe pembayaran harus CASH atau CREDIT' })
    paymentType: string;

    @IsNumber({}, { message: 'Harga final harus berupa angka' })
    @Min(0, { message: 'Harga final tidak boleh negatif' })
    finalPrice: number;

    @IsOptional()
    @IsString({ message: 'Metode pembayaran harus berupa teks' })
    paymentMethod?: string;

    @IsOptional()
    @IsString({ message: 'Nomor referensi harus berupa teks' })
    referenceNumber?: string;

    @IsOptional()
    @IsString({ message: 'Catatan harus berupa teks' })
    notes?: string;

    @IsOptional()
    @ValidateNested({ message: 'Data kredit tidak valid' })
    @Type(() => CreditDataDto)
    creditData?: CreditDataDto;
}
