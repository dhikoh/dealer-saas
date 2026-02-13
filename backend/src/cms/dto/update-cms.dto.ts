import { IsOptional, IsObject, IsArray } from 'class-validator';

export class UpdateCmsContentDto {
    @IsObject()
    @IsOptional()
    hero?: Record<string, any>;

    @IsArray()
    @IsOptional()
    features?: any[];

    @IsArray()
    @IsOptional()
    pricing?: any[];

    @IsArray()
    @IsOptional()
    faq?: any[];

    @IsObject()
    @IsOptional()
    footer?: Record<string, any>;

    @IsArray()
    @IsOptional()
    testimonials?: any[];

    @IsArray()
    @IsOptional()
    partners?: any[];
}
