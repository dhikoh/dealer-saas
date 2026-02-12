import { IsString, IsNotEmpty, IsNumber, IsOptional, IsInt, IsBoolean, IsDateString, Min, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateVehicleDto {
    @IsString({ message: 'Kategori harus berupa teks' })
    @IsNotEmpty({ message: 'Kategori wajib diisi' })
    @IsIn(['CAR', 'MOTORCYCLE', 'TRUCK', 'BUS', 'OTHER'], { message: 'Kategori tidak valid' })
    category: string;

    @IsString({ message: 'Merek harus berupa teks' })
    @IsNotEmpty({ message: 'Merek wajib diisi' })
    make: string;

    @IsString({ message: 'Model harus berupa teks' })
    @IsNotEmpty({ message: 'Model wajib diisi' })
    model: string;

    @IsOptional()
    @IsString({ message: 'Varian harus berupa teks' })
    variant?: string;

    @IsInt({ message: 'Tahun harus berupa angka bulat' })
    @Min(1900, { message: 'Tahun tidak valid' })
    year: number;

    @IsString({ message: 'Warna harus berupa teks' })
    @IsNotEmpty({ message: 'Warna wajib diisi' })
    color: string;

    @IsNumber({}, { message: 'Harga jual harus berupa angka' })
    @Min(0, { message: 'Harga jual tidak boleh negatif' })
    price: number;

    @IsOptional()
    @IsNumber({}, { message: 'Harga beli harus berupa angka' })
    @Min(0, { message: 'Harga beli tidak boleh negatif' })
    purchasePrice?: number;

    @IsOptional()
    @Transform(({ value }) => (value === '' || value === null ? undefined : value))
    @IsDateString({}, { message: 'Format tanggal beli tidak valid' })
    purchaseDate?: string;

    @IsOptional()
    @IsString()
    @IsIn(['AVAILABLE', 'BOOKED', 'SOLD'], { message: 'Status tidak valid' })
    status?: string;

    @IsOptional()
    @IsString()
    @IsIn(['READY', 'REPAIR', 'RESERVED'], { message: 'Kondisi tidak valid' })
    condition?: string;

    @IsOptional()
    @IsString()
    conditionNote?: string;

    @IsOptional()
    @IsBoolean({ message: 'isShowroom harus berupa boolean' })
    isShowroom?: boolean;

    @IsOptional()
    @IsString()
    licensePlate?: string;

    @IsOptional()
    @IsString()
    engineNumber?: string;

    @IsOptional()
    @IsString()
    chassisNumber?: string;

    @IsOptional()
    @IsString()
    bpkbNumber?: string;

    @IsOptional()
    @Transform(({ value }) => (value === '' || value === null ? undefined : value))
    @IsDateString({}, { message: 'Format tanggal STNK tidak valid' })
    @IsOptional()
    @Transform(({ value }) => (value === '' || value === null ? undefined : value))
    @IsDateString({}, { message: 'Format tanggal STNK tidak valid' })
    stnkExpiry?: string;

    @IsOptional()
    @Transform(({ value }) => (value === '' || value === null ? undefined : value))
    @IsDateString({}, { message: 'Format tanggal pajak tidak valid' })
    taxExpiry?: string;

    @IsOptional()
    @IsBoolean()
    bpkbAvailable?: boolean;

    @IsOptional()
    @IsBoolean()
    fakturAvailable?: boolean;

    @IsOptional()
    @IsBoolean()
    serviceBook?: boolean;

    @IsOptional()
    @IsBoolean()
    spareKey?: boolean;

    @IsOptional()
    @IsString()
    specs?: string;

    @IsOptional()
    @IsString()
    images?: string;

    @IsOptional()
    @IsString()
    branchId?: string;

    @IsOptional()
    @IsString()
    bpkbOwnerName?: string;

    @IsOptional()
    @IsBoolean()
    isOwnerDifferent?: boolean;

    @IsOptional()
    @IsString()
    ktpOwnerImage?: string;

    @IsOptional()
    @IsString()
    stnkImage?: string;

    @IsOptional()
    @IsString()
    bpkbImage?: string;

    @IsOptional()
    @IsString()
    taxImage?: string;
}
