import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UpdateStatusDto {
    @IsString({ message: 'Status harus berupa teks' })
    @IsNotEmpty({ message: 'Status wajib diisi' })
    @IsIn(['PENDING', 'PAID', 'COMPLETED', 'CANCELLED'], { message: 'Status harus PENDING, PAID, COMPLETED, atau CANCELLED' })
    status: string;
}
