import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
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
      // CAUTION: Handling unverified users with conflicting usernames is complex.
      // For simplicity in this iteration: if verified, block. If not, maybe we should delete or update?
      // Let's stick to simple "Already in use" for now to be safe, unless it's the exact same email trying to register again.
      if (existingUser.email === normalizedEmail && !existingUser.isVerified) {
        // Resend OTP logic for same unverified email
        const hashedPassword = await bcrypt.hash(password, 10);
        const { code: verificationCode, expiresAt: verificationCodeExpiresAt } = this.generateVerificationCode();

        const updatedUser = await this.prisma.user.update({
          where: { email: normalizedEmail },
          data: {
            password: hashedPassword,
            username: normalizedUsername, // Update username just in case
            name: normalizedUsername,   // Reset name to username until onboarding
            verificationCode,
            verificationCodeExpiresAt,
            isVerified: false,
            onboardingCompleted: false
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
        name: normalizedUsername, // Use username as initial name
        role,
        tenantId: targetTenantId,
        verificationCode,
        verificationCodeExpiresAt,
        isVerified: false,
        onboardingCompleted: false
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
        verificationCode: null // Clear code after use
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

    const { code: newVerificationCode, expiresAt: newDate } = this.generateVerificationCode();

    await this.prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        verificationCode: newVerificationCode,
        verificationCodeExpiresAt: newDate
      }
    });

    // Send Email
    await this.emailService.sendVerificationEmail(normalizedEmail, newVerificationCode);

    return { message: 'Verification code resent' };
  }

  async completeOnboarding(userId: string, data: {
    fullName: string;
    phone: string;
    dealerName: string;
    birthDate: string; // ISO Date String
    domicileAddress: string;
    officeAddress: string;
    language: string;
  }) {
    // Update User and Tenant
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

    // Re-issue token with updated info using the standard method
    return this.createToken(user);
  }

  async login(loginDto: any) {
    const { email, password } = loginDto; // email field contains identifier (email or username)
    const normalizedIdentifier = email.toLowerCase();

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier);

    let user;
    if (isEmail) {
      user = await this.prisma.user.findUnique({ where: { email: normalizedIdentifier } });
    } else {
      user = await this.prisma.user.findUnique({ where: { username: normalizedIdentifier } });
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
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

  // Change password for authenticated user
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
