import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class CreateBrandDto {
    @IsString({ message: 'Nama merek harus berupa teks' })
    @IsNotEmpty({ message: 'Nama merek wajib diisi' })
    name: string;

    @IsString({ message: 'Kategori harus berupa teks' })
    @IsNotEmpty({ message: 'Kategori wajib diisi' })
    @IsIn(['CAR', 'MOTORCYCLE', 'TRUCK', 'BUS', 'OTHER'], { message: 'Kategori tidak valid' })
    category: string;
}
