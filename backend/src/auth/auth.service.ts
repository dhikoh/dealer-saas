import { BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../email/email.service';
import { HttpService } from '@nestjs/axios';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private httpService: HttpService,
  ) { }

  async register(createAuthDto: CreateAuthDto, tenantId?: string) {
    const { email, password, username, role = 'STAFF' } = createAuthDto;

    // Normalize inputs to lowercase
    const normalizedEmail = email.toLowerCase();
    const normalizedUsername = username.toLowerCase();

    // Check if user exists (by email or username)
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { username: normalizedUsername }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.isVerified) {
        throw new BadRequestException('Email or Username already in use');
      }

      // If user exists but NOT verified, we verify if it is the same email
      if (existingUser.email === normalizedEmail && !existingUser.isVerified) {
        // Resend OTP logic for same unverified email with Rate Limiting
        await this.checkOtpRateLimit(existingUser);

        const hashedPassword = await bcrypt.hash(password, 10);
        const { code: verificationCode, expiresAt: verificationCodeExpiresAt } = this.generateVerificationCode();

        const updatedUser = await this.prisma.user.update({
          where: { email: normalizedEmail },
          data: {
            password: hashedPassword,
            username: normalizedUsername,
            name: normalizedUsername,
            verificationCode,
            verificationCodeExpiresAt,
            isVerified: false,
            onboardingCompleted: false,
            otpAttempts: { increment: 1 },
            otpLastSentAt: new Date(),
          }
        });

        await this.emailService.sendVerificationEmail(normalizedEmail, verificationCode);
        return this.createToken(updatedUser);
      }

      throw new BadRequestException('Email or Username already in use');
    }

    let targetTenantId = tenantId;

    if (!targetTenantId) {
      // Create a new Tenant for this Owner with DEMO (Trial) plan
      const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days trial

      const newTenant = await this.prisma.tenant.create({
        data: {
          name: `${normalizedUsername}'s Dealership`,
          slug: normalizedUsername.replace(/ /g, '-') + '-' + Math.floor(Math.random() * 1000),
          planTier: 'DEMO',
          subscriptionStatus: 'TRIAL',
          trialEndsAt,
        }
      });
      targetTenantId = newTenant.id;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { code: verificationCode, expiresAt: verificationCodeExpiresAt } = this.generateVerificationCode();

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        username: normalizedUsername,
        password: hashedPassword,
        name: normalizedUsername,
        role,
        tenantId: targetTenantId,
        verificationCode,
        verificationCodeExpiresAt,
        isVerified: false,
        onboardingCompleted: false,
        otpAttempts: 1,
        otpLastSentAt: new Date()
      }
    });

    await this.emailService.sendVerificationEmail(normalizedEmail, verificationCode);

    return this.createToken(user);
  }

  async verifyEmail(email: string, code: string) {
    const normalizedEmail = email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) throw new BadRequestException('User not found');
    if (user.isVerified) return { message: 'Already verified' };

    if (user.verificationCode !== code) {
      throw new BadRequestException('Invalid OTP Code');
    }

    if (user.verificationCodeExpiresAt && new Date() > user.verificationCodeExpiresAt) {
      throw new BadRequestException('OTP Expired');
    }

    // Verify User
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationCode: null, // Clear code after use
        otpAttempts: 0, // Reset attempts on success
        otpBlockedUntil: null
      }
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerificationCode(email: string) {
    const normalizedEmail = email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) throw new BadRequestException('User not found');
    if (user.isVerified) throw new BadRequestException('User already verified');

    // Rate Limiting Check
    await this.checkOtpRateLimit(user);

    const { code: newVerificationCode, expiresAt: newDate } = this.generateVerificationCode();

    await this.prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        verificationCode: newVerificationCode,
        verificationCodeExpiresAt: newDate,
        otpAttempts: { increment: 1 },
        otpLastSentAt: new Date()
      }
    });

    await this.emailService.sendVerificationEmail(normalizedEmail, newVerificationCode);
    return { message: 'Verification code resent' };
  }

  // --- HELPER: Rate Limiting ---
  private async checkOtpRateLimit(user: any) {
    // 1. Check if Blocked
    if (user.otpBlockedUntil && new Date() < user.otpBlockedUntil) {
      throw new ForbiddenException(`Terlalu banyak percobaan. Akun Anda dibekukan sementara selama 24 jam. Hubungi Admin via WhatsApp: 087712333434`);
    }

    // 2. Check Backoff Time based on Attempts
    if (user.otpLastSentAt) {
      const timeSinceLastOtp = new Date().getTime() - user.otpLastSentAt.getTime();
      const attempts = user.otpAttempts || 0;
      let minWaitTime = 0; // in milliseconds

      if (attempts === 1) minWaitTime = 60 * 1000; // 1 min
      else if (attempts === 2) minWaitTime = 2 * 60 * 1000; // 2 min
      else if (attempts === 3) minWaitTime = 3 * 60 * 1000; // 3 min
      else if (attempts >= 4) {
        // Block User for 24h
        const blockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await this.prisma.user.update({
          where: { id: user.id },
          data: { otpBlockedUntil: blockUntil }
        });
        throw new ForbiddenException(`Terlalu banyak percobaan. Akun Anda dibekukan sementara selama 24 jam. Hubungi Admin via WhatsApp: 087712333434`);
      }

      if (timeSinceLastOtp < minWaitTime) {
        const remainingSeconds = Math.ceil((minWaitTime - timeSinceLastOtp) / 1000);
        throw new HttpException({
          status: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Rate Limit Exceeded',
          message: `Mohon tunggu ${remainingSeconds} detik sebelum meminta kode baru.`,
          retryAfter: remainingSeconds
        }, HttpStatus.TOO_MANY_REQUESTS);
      }
    }
  }

  async completeOnboarding(userId: string, data: {
    fullName: string;
    phone: string;
    dealerName: string;
    birthDate: string;
    domicileAddress: string;
    officeAddress: string;
    language: string;
  }) {
    // SECURITY: Verify user state before allowing onboarding
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isVerified: true, onboardingCompleted: true }
    });

    if (!existingUser) {
      throw new BadRequestException('User not found');
    }

    if (!existingUser.isVerified) {
      throw new ForbiddenException('Email must be verified before completing onboarding');
    }

    if (existingUser.onboardingCompleted) {
      throw new BadRequestException('Onboarding already completed');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.fullName,
        phone: data.phone,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        address: data.domicileAddress,
        language: data.language,
        onboardingCompleted: true,
        tenant: {
          update: {
            name: data.dealerName,
            address: data.officeAddress
          }
        }
      },
      include: { tenant: true }
    });

    return this.createToken(user);
  }

  async login(loginDto: any) {
    const { email, password } = loginDto;
    const normalizedIdentifier = email.toLowerCase();

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier);

    let user;
    if (isEmail) {
      user = await this.prisma.user.findUnique({
        where: { email: normalizedIdentifier },
        include: { tenant: true }
      });
    } else {
      user = await this.prisma.user.findUnique({
        where: { username: normalizedIdentifier },
        include: { tenant: true }
      });
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // SECURITY: Check if user is temporarily blocked (OTP abuse)
    if (user.otpBlockedUntil && new Date() < user.otpBlockedUntil) {
      throw new ForbiddenException('Akun Anda dibekukan sementara. Hubungi Admin via WhatsApp: 087712333434');
    }

    // SECURITY: Check tenant subscription status
    if (user.tenant && user.tenant.subscriptionStatus === 'SUSPENDED') {
      throw new ForbiddenException('Akun dealer Anda telah dinonaktifkan. Hubungi Admin untuk informasi lebih lanjut.');
    }

    if (user.tenant && user.tenant.subscriptionStatus === 'CANCELLED') {
      throw new ForbiddenException('Langganan dealer Anda telah dibatalkan. Silakan hubungi Admin.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.createToken(user);
  }

  private createToken(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      isVerified: user.isVerified,
      onboardingCompleted: user.onboardingCompleted
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        isVerified: user.isVerified,
        onboardingCompleted: user.onboardingCompleted
      },
    };
  }

  // ==================== GOOGLE OAUTH ====================

  async googleLogin(credential: string) {
    // Verify Google ID token
    let googlePayload: any;
    try {
      const response = await this.httpService.axiosRef.get(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
      );
      googlePayload = response.data;
    } catch (error) {
      throw new UnauthorizedException('Token Google tidak valid');
    }

    const { email, name, sub: googleId, email_verified } = googlePayload;

    if (!email_verified) {
      throw new BadRequestException('Email Google belum diverifikasi');
    }

    const normalizedEmail = email.toLowerCase();

    // Check if user already exists (by googleId or email)
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email: normalizedEmail },
        ]
      },
      include: { tenant: true },
    });

    if (user) {
      // Existing user — update googleId if not set, then login
      if (!user.googleId) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId, isOauth: true },
        });
      }

      // Check tenant status (same as normal login)
      if (user.tenant && user.tenant.subscriptionStatus === 'SUSPENDED') {
        throw new ForbiddenException('Akun dealer Anda telah dinonaktifkan.');
      }
      if (user.tenant && user.tenant.subscriptionStatus === 'CANCELLED') {
        throw new ForbiddenException('Langganan dealer Anda telah dibatalkan.');
      }

      return this.createToken(user);
    }

    // New user — create account + tenant (same as register flow)
    const username = normalizedEmail.split('@')[0] + '-' + Math.floor(Math.random() * 1000);
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

    const newTenant = await this.prisma.tenant.create({
      data: {
        name: `${name || username}'s Dealership`,
        slug: username.replace(/[^a-z0-9-]/g, '-'),
        planTier: 'DEMO',
        subscriptionStatus: 'TRIAL',
        trialEndsAt,
      },
    });

    // Generate a random password (user can set one later via Settings)
    const randomPassword = randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const newUser = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        username,
        password: hashedPassword,
        name: name || username,
        role: 'OWNER',
        tenantId: newTenant.id,
        isVerified: true, // Google already verified email
        onboardingCompleted: false,
        isOauth: true,
        googleId,
      },
      include: { tenant: true },
    });

    return this.createToken(newUser);
  }

  // ==================== FORGOT PASSWORD ====================

  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { success: true, message: 'Jika email terdaftar, link reset password telah dikirim.' };
    }

    // Generate reset token (random + expire 30 minutes)
    const resetToken = randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    // Build reset link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/auth/reset-password/${resetToken}`;

    await this.emailService.sendResetPasswordEmail(normalizedEmail, resetLink);

    return { success: true, message: 'Jika email terdaftar, link reset password telah dikirim.' };
  }

  // ==================== RESET PASSWORD ====================

  async resetPassword(token: string, newPassword: string) {
    if (!token || token.length < 10) {
      throw new BadRequestException('Token tidak valid');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Password baru minimal 6 karakter');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() }, // Token not expired
      },
    });

    if (!user) {
      throw new BadRequestException('Token tidak valid atau sudah kadaluarsa');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return { success: true, message: 'Password berhasil direset. Silakan login dengan password baru.' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User tidak ditemukan');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Password saat ini salah');
    }

    // Validate new password
    if (newPassword.length < 6) {
      throw new BadRequestException('Password baru minimal 6 karakter');
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true, message: 'Password berhasil diubah' };
  }

  private generateVerificationCode(): { code: string; expiresAt: Date } {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    return { code, expiresAt };
  }
}
