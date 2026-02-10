import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateModelDto {
    @IsString({ message: 'Brand ID harus berupa teks' })
    @IsNotEmpty({ message: 'Brand ID wajib diisi' })
    brandId: string;

    @IsString({ message: 'Nama model harus berupa teks' })
    @IsNotEmpty({ message: 'Nama model wajib diisi' })
    name: string;

    @IsOptional()
    @IsString({ message: 'Varian harus berupa teks' })
    variants?: string;
}
