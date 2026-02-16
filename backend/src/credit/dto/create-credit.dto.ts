import { IsString, IsNotEmpty, IsNumber, IsOptional, IsIn, Min, MaxLength } from 'class-validator';

export class CreateCreditDto {
    @IsString({ message: 'ID transaksi harus berupa teks' })
    @IsNotEmpty({ message: 'ID transaksi wajib diisi' })
    transactionId: string;

    @IsNumber({}, { message: 'Uang muka harus berupa angka' })
    @Min(0, { message: 'Uang muka tidak boleh negatif' })
    downPayment: number;

    @IsNumber({}, { message: 'Total kredit harus berupa angka' })
    @Min(0, { message: 'Total kredit tidak boleh negatif' })
    totalAmount: number;

    @IsNumber({}, { message: 'Suku bunga harus berupa angka' })
    @Min(0, { message: 'Suku bunga tidak boleh negatif' })
    interestRate: number;

    @IsNumber({}, { message: 'Tenor harus berupa angka' })
    @Min(1, { message: 'Tenor minimal 1 bulan' })
    tenorMonths: number;

    @IsNumber({}, { message: 'Cicilan bulanan harus berupa angka' })
    @Min(0, { message: 'Cicilan bulanan tidak boleh negatif' })
    monthlyPayment: number;

    @IsOptional()
    @IsString()
    @IsIn(['LEASING', 'DEALER_CREDIT', 'DEALER_TO_LEASING'], { message: 'Tipe kredit tidak valid' })
    creditType?: string;

    @IsOptional()
    @IsString({ message: 'Nama perusahaan leasing harus berupa teks' })
    @MaxLength(255, { message: 'Nama leasing maksimal 255 karakter' })
    leasingCompany?: string;
}
