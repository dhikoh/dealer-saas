import { IsString, IsOptional, IsArray } from 'class-validator';

export class GenerateApiKeyDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    scopes?: string[];
}
