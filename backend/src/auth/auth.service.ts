import { BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable, UnauthorizedException, Inject, forwardRef, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../email/email.service';
import { HttpService } from '@nestjs/axios';
import { randomBytes } from 'crypto';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { VehicleService } from '../vehicle/vehicle.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // Login attempt tracking (in-memory, resets on restart)
  private loginAttempts = new Map<string, { count: number; lastAttempt: Date; blockedUntil?: Date }>();
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOGIN_BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private httpService: HttpService,
    private activityLogService: ActivityLogService,
    @Inject(forwardRef(() => VehicleService))
    private vehicleService: VehicleService,
  ) { }

  // Clean up old entries every 30 minutes
  private cleanupLoginAttempts() {
    const now = new Date();
    for (const [key, data] of this.loginAttempts) {
      if (data.blockedUntil && now > data.blockedUntil) {
        this.loginAttempts.delete(key);
      } else if (now.getTime() - data.lastAttempt.getTime() > this.LOGIN_BLOCK_DURATION) {
        this.loginAttempts.delete(key);
      }
    }
  }

  private checkLoginRateLimit(identifier: string) {
    this.cleanupLoginAttempts();
    const attempts = this.loginAttempts.get(identifier);
    if (attempts?.blockedUntil && new Date() < attempts.blockedUntil) {
      const minutesLeft = Math.ceil((attempts.blockedUntil.getTime() - Date.now()) / 60000);
      throw new ForbiddenException(
        `Terlalu banyak percobaan login gagal. Coba lagi dalam ${minutesLeft} menit.`
      );
    }
  }

  private recordLoginFailure(identifier: string) {
    const existing = this.loginAttempts.get(identifier);
    const count = (existing?.count || 0) + 1;
    const data: { count: number; lastAttempt: Date; blockedUntil?: Date } = {
      count,
      lastAttempt: new Date(),
    };
    if (count >= this.MAX_LOGIN_ATTEMPTS) {
      data.blockedUntil = new Date(Date.now() + this.LOGIN_BLOCK_DURATION);
    }
    this.loginAttempts.set(identifier, data);
  }

  private clearLoginAttempts(identifier: string) {
    this.loginAttempts.delete(identifier);
  }

  async register(createAuthDto: CreateAuthDto, tenantId?: string) {
    const { email, password, username } = createAuthDto;

    // Normalize inputs to lowercase
    const normalizedEmail = email.toLowerCase();
    const normalizedUsername = username.toLowerCase();

    // Check if user exists (by email or username)
    const existingUser = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { email: normalizedEmail },
          { username: normalizedUsername }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.isVerified) {
        throw new BadRequestException('Email atau Username sudah terdaftar');
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
        return await this.createToken(updatedUser);
      }

      throw new BadRequestException('Email atau Username sudah terdaftar');
    }

    let targetTenantId = tenantId;
    let userRole = 'STAFF'; // Default role — OWNER is set below when creating a new tenant

    if (!targetTenantId) {
      // Create a new Tenant for this Owner with DEMO (Trial) plan
      const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days trial

      const newTenant = await this.prisma.tenant.create({
        data: {
          name: `${normalizedUsername}'s Dealership`,
          slug: normalizedUsername.replace(/ /g, '-') + '-' + randomBytes(4).toString('hex'),
          planTier: 'DEMO',
          subscriptionStatus: 'TRIAL',
          trialEndsAt,
        }
      });
      targetTenantId = newTenant.id;
      // CRITICAL: If we created a new tenant, this user MUST be the OWNER
      userRole = 'OWNER';
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { code: verificationCode, expiresAt: verificationCodeExpiresAt } = this.generateVerificationCode();

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        username: normalizedUsername,
        password: hashedPassword,
        name: normalizedUsername,
        role: userRole,
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

    return await this.createToken(user);
  }

  async verifyEmail(email: string, code: string) {
    const normalizedEmail = email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) throw new BadRequestException('Pengguna tidak ditemukan');
    if (user.isVerified) {
      // Already verified — return token so user can proceed
      const token = await this.createToken(user);
      return { message: 'Email sudah terverifikasi', ...token };
    }

    if (user.verificationCode !== code) {
      throw new BadRequestException('Kode OTP tidak valid');
    }

    if (user.verificationCodeExpiresAt && new Date() > user.verificationCodeExpiresAt) {
      throw new BadRequestException('Kode OTP sudah kadaluarsa');
    }

    // Verify User
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationCode: null, // Clear code after use
        otpAttempts: 0, // Reset attempts on success
        otpBlockedUntil: null
      }
    });

    // Return auth token so user can proceed to onboarding
    const token = await this.createToken(updatedUser);
    return { message: 'Email berhasil diverifikasi', ...token };
  }

  async resendVerificationCode(email: string) {
    const normalizedEmail = email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) throw new BadRequestException('Pengguna tidak ditemukan');
    if (user.isVerified) throw new BadRequestException('Email sudah terverifikasi');

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
      throw new BadRequestException('Pengguna tidak ditemukan');
    }

    if (!existingUser.isVerified) {
      throw new ForbiddenException('Email harus diverifikasi sebelum menyelesaikan onboarding');
    }

    if (existingUser.onboardingCompleted) {
      throw new BadRequestException('Onboarding sudah diselesaikan');
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

    // Seed default vehicle brands/models for the new tenant
    try {
      if (user.tenantId) {
        await this.vehicleService.seedDefaultBrands(user.tenantId);
      }
    } catch (error) {
      // Don't fail onboarding if seeding fails, just log it
      this.logger.error('Failed to seed default brands', error instanceof Error ? error.stack : error);
    }

    return await this.createToken(user);
  }

  async login(loginDto: { email: string; password: string }) {
    const { email, password } = loginDto;
    const normalizedIdentifier = email.toLowerCase();

    // SECURITY: Check login rate limit
    this.checkLoginRateLimit(normalizedIdentifier);

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
      this.recordLoginFailure(normalizedIdentifier);
      throw new UnauthorizedException('Email/username atau password salah');
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
      this.recordLoginFailure(normalizedIdentifier);
      throw new UnauthorizedException('Email/username atau password salah');
    }

    // Clear login attempts on success
    this.clearLoginAttempts(normalizedIdentifier);

    // Log successful login (fire-and-forget)
    if (user.tenantId) {
      this.activityLogService.log({
        tenantId: user.tenantId,
        userId: user.id,
        userEmail: user.email,
        action: 'LOGIN',
      });
    }

    return await this.createToken(user);
  }

  private async createToken(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      isVerified: user.isVerified,
      onboardingCompleted: user.onboardingCompleted
    };

    // Generate refresh token (UUID, 7 day expiry)
    const refreshTokenValue = randomBytes(40).toString('hex');
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId: user.id,
        expiresAt: refreshExpiresAt,
      },
    });

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: refreshTokenValue,
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

  // ==================== REFRESH TOKEN ====================

  async refreshToken(token: string) {
    if (!token) {
      throw new UnauthorizedException('Refresh token diperlukan');
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: { include: { tenant: true } } },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token tidak valid');
    }

    if (new Date() > storedToken.expiresAt) {
      // Token expired — delete it and reject
      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new UnauthorizedException('Refresh token sudah kadaluarsa');
    }

    // Token rotation: delete old token
    await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });

    // Create new tokens
    return this.createToken(storedToken.user);
  }

  async logout(refreshTokenValue: string) {
    if (!refreshTokenValue) return { success: true };

    try {
      await this.prisma.refreshToken.deleteMany({
        where: { token: refreshTokenValue },
      });
    } catch {
      // Token might not exist, that's fine
    }

    return { success: true, message: 'Berhasil logout' };
  }

  // ==================== GOOGLE OAUTH ====================

  async googleLogin(credential: string) {
    // Verify Google ID token using official library
    let googlePayload: any;
    const googleClientId = process.env.GOOGLE_CLIENT_ID;

    try {
      if (googleClientId) {
        // SECURE: Use official google-auth-library with audience validation
        const { OAuth2Client } = require('google-auth-library');
        const client = new OAuth2Client(googleClientId);
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: googleClientId, // Only accept tokens for OUR app
        });
        googlePayload = ticket.getPayload();
      } else {
        // FALLBACK: Legacy method (log warning — should set GOOGLE_CLIENT_ID)
        console.warn('[AUTH] GOOGLE_CLIENT_ID not set — using legacy tokeninfo without audience validation');
        const response = await this.httpService.axiosRef.get(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
        );
        googlePayload = response.data;
      }
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
      if (!user.googleId || !user.isVerified) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            isOauth: true,
            isVerified: true // Trust Google verification
          },
        });
      }

      // Check tenant status (same as normal login)
      if (user.tenant && user.tenant.subscriptionStatus === 'SUSPENDED') {
        throw new ForbiddenException('Akun dealer Anda telah dinonaktifkan.');
      }
      if (user.tenant && user.tenant.subscriptionStatus === 'CANCELLED') {
        throw new ForbiddenException('Langganan dealer Anda telah dibatalkan.');
      }

      return await this.createToken(user);
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

    return await this.createToken(newUser);
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

    // Log password change (fire-and-forget)
    if (user.tenantId) {
      this.activityLogService.log({
        tenantId: user.tenantId,
        userId: user.id,
        userEmail: user.email,
        action: 'PASSWORD_CHANGE',
      });
    }

    return { success: true, message: 'Password berhasil diubah' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        address: true,
        birthDate: true,
        role: true,
        language: true,
        tenantId: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            planTier: true,
            subscriptionStatus: true,
            subscriptionStartedAt: true,
            subscriptionEndsAt: true,
            nextBillingDate: true,
            trialEndsAt: true,
            monthlyBill: true,
            autoRenew: true,
            address: true,
            phone: true,
            email: true,
          }
        }
      },
    });

    if (!user) {
      throw new BadRequestException('User tidak ditemukan');
    }

    return user;
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string; address?: string }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.address !== undefined && { address: data.address }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        address: true,
        role: true,
        tenantId: true,
      },
    });

    // If OWNER, also sync tenant contact info
    if (user.role === 'OWNER' && user.tenantId) {
      await this.prisma.tenant.update({
        where: { id: user.tenantId },
        data: {
          ...(data.phone !== undefined && { phone: data.phone }),
        },
      });
    }

    return user;
  }

  private generateVerificationCode(): { code: string; expiresAt: Date } {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    return { code, expiresAt };
  }
}
