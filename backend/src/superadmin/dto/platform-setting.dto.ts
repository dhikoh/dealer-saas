import { IsNotEmpty } from 'class-validator';

export class UpdatePlatformSettingDto {
    @IsNotEmpty()
    value: any;
}
