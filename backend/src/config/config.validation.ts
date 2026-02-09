import * as Joi from 'joi';

/**
 * Environment variable validation schema
 * 
 * All required environment variables are validated at startup.
 * Application will fail to start if validation fails.
 */
export const configValidationSchema = Joi.object({
    // ==================== REQUIRED ====================
    DATABASE_URL: Joi.string().required()
        .description('PostgreSQL connection string'),

    JWT_SECRET: Joi.string().min(32).required()
        .description('Secret key for JWT signing (min 32 chars)'),

    // ==================== OPTIONAL (with defaults) ====================
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),

    PORT: Joi.number().default(4000)
        .description('Server port'),

    CORS_ORIGINS: Joi.string().default('http://localhost:3000')
        .description('Comma-separated list of allowed origins'),

    // ==================== EMAIL (Optional but recommended) ====================
    SMTP_HOST: Joi.string().optional()
        .description('SMTP server host'),

    SMTP_PORT: Joi.number().optional()
        .description('SMTP server port'),

    SMTP_USER: Joi.string().optional()
        .description('SMTP username'),

    SMTP_PASS: Joi.string().optional()
        .description('SMTP password'),

    SMTP_FROM: Joi.string().optional()
        .description('Default from email address'),

    // ==================== FILE STORAGE (Optional) ====================
    STORAGE_TYPE: Joi.string()
        .valid('local', 's3')
        .default('local')
        .description('File storage type'),

    UPLOAD_DIR: Joi.string()
        .default('./uploads')
        .description('Local upload directory'),

    S3_BUCKET: Joi.string().when('STORAGE_TYPE', {
        is: 's3',
        then: Joi.required(),
        otherwise: Joi.optional(),
    }),

    S3_REGION: Joi.string().when('STORAGE_TYPE', {
        is: 's3',
        then: Joi.required(),
        otherwise: Joi.optional(),
    }),

    S3_ACCESS_KEY: Joi.string().when('STORAGE_TYPE', {
        is: 's3',
        then: Joi.required(),
        otherwise: Joi.optional(),
    }),

    S3_SECRET_KEY: Joi.string().when('STORAGE_TYPE', {
        is: 's3',
        then: Joi.required(),
        otherwise: Joi.optional(),
    }),
});
