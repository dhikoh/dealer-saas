import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { UserStateGuard } from './auth/user-state.guard';
import { TenantGuard } from './auth/tenant.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TenantModule } from './tenant/tenant.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';

import { VehicleModule } from './vehicle/vehicle.module';
import { CustomerModule } from './customer/customer.module';
import { CreditModule } from './credit/credit.module';
import { BlacklistModule } from './blacklist/blacklist.module';
import { ReminderModule } from './reminder/reminder.module';
import { PdfModule } from './pdf/pdf.module';
import { SuperadminModule } from './superadmin/superadmin.module';
import { BillingModule } from './billing/billing.module';
import { NotificationModule } from './notification/notification.module';
import { TransactionModule } from './transaction/transaction.module';
import { HealthModule } from './health/health.module';
import { UploadModule } from './upload/upload.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { configValidationSchema } from './config/config.validation';
import { ScheduleModule } from '@nestjs/schedule';
import { CleanupModule } from './cleanup/cleanup.module';
import { SearchModule } from './search/search.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { ExportModule } from './export/export.module';
import { ReportModule } from './report/report.module';
import { PublicModule } from './public/public.module';
import { BranchModule } from './branch/branch.module';
import { StockTransferModule } from './stock-transfer/stock-transfer.module';
import { DealerGroupModule } from './dealer-group/dealer-group.module';
import { PlanModule } from './plan/plan.module';
import { CmsModule } from './cms/cms.module';
import { PaymentMethodModule } from './payment-method/payment-method.module';
import { FinanceModule } from './finance/finance.module';

@Module({
  imports: [
    // Environment configuration with validation
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema,
      validationOptions: {
        abortEarly: false, // Show all validation errors
      },
    }),
    // Rate Limiting: 100 requests per 60 seconds per IP
    // NOTE (L4): This uses in-memory storage by default (@nestjs/throttler).
    // Limitations:
    //   - Resets on server restart
    //   - Not shared across multiple instances (clustered deployments)
    // For production multi-instance deployments, consider:
    //   ThrottlerModule.forRoot({ storage: new ThrottlerStorageRedisService(redisClient) })
    //   via @nest-lab/throttler-storage-redis
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    PrismaModule,
    TenantModule,
    AuthModule,
    EmailModule,
    VehicleModule,
    CustomerModule,
    CreditModule,
    BlacklistModule,
    ReminderModule,
    PdfModule,
    SuperadminModule,
    BillingModule,
    NotificationModule,
    TransactionModule,
    HealthModule,
    UploadModule,
    AnalyticsModule,
    SearchModule,
    ActivityLogModule,
    ExportModule,
    ReportModule,
    PublicModule,
    BranchModule,
    StockTransferModule,
    DealerGroupModule,
    PlanModule,
    CmsModule,
    PaymentMethodModule,
    FinanceModule,
    ScheduleModule.forRoot(), // Cron job support
    CleanupModule, // Auto-delete inactive tenants
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 1. Rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // 2. JWT Authentication globally (skip with @Public())
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 3. User state enforcement globally (email verified + onboarding)
    {
      provide: APP_GUARD,
      useClass: UserStateGuard,
    },
    // 4. Tenant isolation globally (strict tenant context enforcement)
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
  ],
})
export class AppModule { }
