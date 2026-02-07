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
    const { email, password, name, role = 'STAFF' } = createAuthDto;

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      if (existingUser.isVerified) {
        throw new BadRequestException('Email already in use');
      }

      // If user exists but NOT verified, we overwrite/resend OTP
      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      const updatedUser = await this.prisma.user.update({
        where: { email: normalizedEmail },
        data: {
          password: hashedPassword,
          name,
          verificationCode,
          verificationCodeExpiresAt,
          isVerified: false,
          onboardingCompleted: false
        }
      });

      // Send Verification Email
      await this.emailService.sendVerificationEmail(normalizedEmail, verificationCode);

      return this.createToken(updatedUser);
    }

    let targetTenantId = tenantId;

    if (!targetTenantId) {
      // Create a new Tenant for this Owner
      const newTenant = await this.prisma.tenant.create({
        data: {
          name: `${name}'s Dealership`,
          slug: name.toLowerCase().replace(/ /g, '-') + '-' + Math.floor(Math.random() * 1000),
        }
      });
      targetTenantId = newTenant.id;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 6-digit OTP
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name,
        role,
        tenantId: targetTenantId,
        verificationCode,
        verificationCodeExpiresAt,
        isVerified: false,
        onboardingCompleted: false
      }
    });

    // Send Verification Email
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

    const newVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newDate = new Date(Date.now() + 15 * 60 * 1000);

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

    // Re-issue token with updated info if needed, or just return success
    // Usually frontend needs updated user info
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      onboardingCompleted: true
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role, // role might be passed in payload
        tenant: user.tenant,
        onboardingCompleted: true
      }
    };
  }

  async login(loginDto: any) {
    const { email, password } = loginDto;
    const normalizedEmail = email.toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

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
}
