import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  async register(createAuthDto: CreateAuthDto, tenantId?: string) {
    const { email, password, name, role = 'STAFF' } = createAuthDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    // For Phase 1 & 2, if no tenantId is provided, we might need a default or create one on the fly.
    // However, Register usually involves creating a Tenant (Owner) OR adding a user to an existing Tenant (Staff).
    // For simplicity of this "Owner Registration" flow:

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

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        tenantId: targetTenantId,
      },
    });

    return this.createToken(user);
  }

  async login(loginDto: any) {
    const { email, password } = loginDto;
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
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
      tenantId: user.tenantId
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenant: user.tenant
      }
    };
  }
}
