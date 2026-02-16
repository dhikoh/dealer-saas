import { IsString, IsOptional, MaxLength } from 'class-validator';

export class GenerateApiKeyDto {
    @IsString()
    @MaxLength(100, { message: 'Nama API key maksimal 100 karakter' })
    name: string;

    @IsOptional()
    @IsString({ each: true })
    @MaxLength(50, { each: true, message: 'Scope maksimal 50 karakter' })
    scopes?: string[];
}
