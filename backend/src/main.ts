import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Trust Proxy for Throttler (Coolify/Docker/Nginx)
  app.set('trust proxy', 1);

  // Enable Cookie Parser
  app.use(cookieParser());

  const configService = app.get(ConfigService);

  // ==================== STATIC FILES (Uploads) ====================
  const uploadDir = configService.get('UPLOAD_DIR', './uploads');
  app.useStaticAssets(join(process.cwd(), uploadDir), {
    prefix: '/uploads/',
  });

  // ==================== SWAGGER API DOCS ====================
  const swaggerConfig = new DocumentBuilder()
    .setTitle('OTOHUB API')
    .setDescription('Dealer Management SaaS Platform API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication & Registration')
    .addTag('vehicles', 'Vehicle Inventory Management')
    .addTag('transactions', 'Sales & Purchase Transactions')
    .addTag('customers', 'Customer Management')
    .addTag('credit', 'Credit & Installment Management')
    .addTag('analytics', 'Dashboard Analytics & Reports')
    .addTag('tenant', 'Tenant & Branch Management')
    .addTag('upload', 'File Upload')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  // ==================== SECURITY HEADERS ====================
  app.use(helmet({
    crossOriginResourcePolicy: false,
  }));

  // ==================== CORS CONFIGURATION ====================
  const corsOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  // Force add production domains if not present
  const requiredOrigins = [
    'https://oto.modula.click',
    'https://www.modula.click',
    'http://localhost:3000'
  ];

  requiredOrigins.forEach(origin => {
    if (!corsOrigins.includes(origin)) {
      corsOrigins.push(origin);
    }
  });

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Skip-Redirect'],
  });

  // ==================== GLOBAL VALIDATION ====================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ==================== GLOBAL EXCEPTION FILTER ====================
  app.useGlobalFilters(new HttpExceptionFilter());

  // NOTE: Global guards (JwtAuthGuard, UserStateGuard, RolesGuard, TenantGuard)
  // are registered via APP_GUARD providers in app.module.ts.
  // Do NOT use app.useGlobalGuards() here — it bypasses DI and causes double execution.

  const port = configService.get('PORT', 4000);
  await app.listen(port);

  logger.log(`🚀 Server running on port ${port}`);
  logger.log(`📄 Swagger docs at http://localhost:${port}/api-docs`);
  logger.log(`📁 Static files served from: ${uploadDir}`);
  logger.log(`🔒 Security: Helmet, CORS, Validation, Guards, ExceptionFilter enabled`);
  logger.log(`🌍 Environment: ${configService.get('NODE_ENV', 'development')}`);

  const jwtSecret = process.env.JWT_SECRET;
  logger.log(`🔑 JWT_SECRET: ${jwtSecret ? `Present (Length: ${jwtSecret.length})` : 'MISSING'}`);
}
bootstrap();
