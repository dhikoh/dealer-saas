import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { VehicleModule } from '../vehicle/vehicle.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    HttpModule, // For Google OAuth token verification
    forwardRef(() => VehicleModule), // For seeding default brands during onboarding
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error('FATAL: JWT_SECRET is not defined in AuthModule');
        return {
          secret,
          signOptions: { expiresIn: '7d' }, // Matches cookie maxAge
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule { }
