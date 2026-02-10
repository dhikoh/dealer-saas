import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TenantModule } from './tenant/tenant.module';
import { TenantMiddleware } from './middleware/tenant.middleware';
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
    ScheduleModule.forRoot(), // Cron job support
    CleanupModule, // Auto-delete inactive tenants
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
