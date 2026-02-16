import { IsOptional, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * CMS content is SUPERADMIN-only. Objects stored as JSON in DB.
 * MaxLength is enforced at JSON stringification level — individual nested
 * objects are validated by @IsObject/@IsArray to prevent non-object payloads.
 * Deep validation of nested CMS content structure is handled at the service layer.
 */
export class UpdateCmsContentDto {
    @IsObject()
    @IsOptional()
    hero?: Record<string, unknown>;

    @IsArray()
    @IsOptional()
    features?: Record<string, unknown>[];

    @IsArray()
    @IsOptional()
    pricing?: Record<string, unknown>[];

    @IsArray()
    @IsOptional()
    faq?: Record<string, unknown>[];

    @IsObject()
    @IsOptional()
    footer?: Record<string, unknown>;

    @IsArray()
    @IsOptional()
    testimonials?: Record<string, unknown>[];

    @IsArray()
    @IsOptional()
    partners?: Record<string, unknown>[];
}
