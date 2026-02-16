import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdatePlatformSettingDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(10000, { message: 'Nilai setting maksimal 10000 karakter' })
    value: string;
}
