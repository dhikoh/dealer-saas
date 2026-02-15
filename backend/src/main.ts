import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { UserStateGuard } from './auth/user-state.guard';
import { TenantGuard } from './auth/tenant.guard';
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
  const corsOrigins = configService.get('CORS_ORIGINS', 'http://localhost:3000');
  const origins = corsOrigins.split(',');
  const logger = new Logger('Bootstrap');
  logger.log(`🔐 CORS Origins Configured: ${origins.join(', ')}`);

  app.enableCors({
    origin: origins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
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

  // ==================== GLOBAL GUARDS ====================
  const reflector = app.get(Reflector);
  app.useGlobalGuards(
    new JwtAuthGuard(reflector),
    new UserStateGuard(reflector),
    new RolesGuard(reflector),
    new TenantGuard()
  );

  const port = configService.get('PORT', 4000);
  await app.listen(port);

  logger.log(`🚀 Server running on port ${port}`);
  logger.log(`📄 Swagger docs at http://localhost:${port}/api-docs`);
  logger.log(`📁 Static files served from: ${uploadDir}`);
  logger.log(`🔒 Security: Helmet, CORS, Validation, Guards, ExceptionFilter enabled`);
  logger.log(`🌍 Environment: ${configService.get('NODE_ENV', 'development')}`);
}
bootstrap();
