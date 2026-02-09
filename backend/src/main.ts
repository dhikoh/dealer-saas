import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { UserStateGuard } from './auth/user-state.guard';
import { TenantGuard } from './auth/tenant.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ==================== SECURITY HEADERS ====================
  app.use(helmet());

  // ==================== CORS CONFIGURATION ====================
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  });

  // ==================== GLOBAL VALIDATION ====================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true, // Auto-transform payloads to DTO instances
    }),
  );

  // ==================== GLOBAL GUARDS ====================
  // Order: JwtAuthGuard (authenticate) → UserStateGuard (verify flow completion) → RolesGuard (authorize) → TenantGuard (isolate)
  const reflector = app.get(Reflector);
  app.useGlobalGuards(
    new JwtAuthGuard(reflector),    // First: Authenticate user (checks @Public)
    new UserStateGuard(reflector),  // Second: Check user state (isVerified, onboardingCompleted)
    new RolesGuard(reflector),      // Third: Check role permissions
    new TenantGuard()               // Fourth: Enforce tenant isolation
  );

  await app.listen(process.env.PORT ?? 4000);
  console.log(`🚀 Server running on port ${process.env.PORT ?? 4000}`);
  console.log(`🔒 Security: Helmet, CORS, Validation, JwtAuthGuard, UserStateGuard, RolesGuard, TenantGuard enabled`);
}
bootstrap();

