import { Controller, Post, Get, Put, Body, HttpCode, HttpStatus, Request, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import {
  LoginDto, VerifyEmailDto, ResendOtpDto, OnboardingDto,
  ChangePasswordDto, UpdateProfileDto, GoogleLoginDto,
  ForgotPasswordDto, ResetPasswordDto, RefreshTokenDto, LogoutDto,
} from './dto/auth.dto';
import { Public } from './public.decorator';
import { AllowUnonboarded } from './user-state.decorator';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  private setCookie(response: Response, token: string) {
    const isProd = process.env.NODE_ENV === 'production';
    const domain = process.env.COOKIE_DOMAIN || (isProd ? '.modula.click' : undefined);

    response.cookie('auth_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      domain, // Allow sharing across subdomains (api.modula.click -> oto.modula.click)
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // Stricter: 3 registrations per minute
  @Post('register')
  async register(@Body() createAuthDto: CreateAuthDto, @Res({ passthrough: true }) response: Response) {
    const data = await this.authService.register(createAuthDto);
    this.setCookie(response, data.access_token);
    return data;
  }


  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Limit: 5 requests per minute
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const data = await this.authService.login(loginDto);
    this.setCookie(response, data.access_token);
    return data;
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('verify')
  async verify(@Body() body: VerifyEmailDto, @Res({ passthrough: true }) response: Response) {
    const data = await this.authService.verifyEmail(body.email, body.code);
    this.setCookie(response, data.access_token);
    return data;
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('resend-otp')
  resendOtp(@Body() body: ResendOtpDto) {
    return this.authService.resendVerificationCode(body.email);
  }

  // Protected: Requires authentication + allows unverified → verified unonboarded users
  @AllowUnonboarded()
  @Post('onboarding')
  async onboarding(@Body() body: OnboardingDto, @Request() req, @Res({ passthrough: true }) response: Response) {
    const data = await this.authService.completeOnboarding(req.user.userId, {
      fullName: body.fullName,
      phone: body.phone,
      dealerName: body.dealerName,
      birthDate: body.birthDate,
      domicileAddress: body.domicileAddress,
      officeAddress: body.officeAddress,
      language: body.language
    });
    this.setCookie(response, data.access_token);
    return data;
  }


  // Protected: Requires authentication
  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  async changePassword(
    @Body() body: ChangePasswordDto,
    @Request() req
  ) {
    return this.authService.changePassword(req.user.sub, body.currentPassword, body.newPassword);
  }

  // GET /auth/me - Get current user profile
  @Get('me')
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.sub || req.user.userId);
  }

  // PUT /auth/profile - Update current user profile
  @Put('profile')
  async updateProfile(
    @Body() body: UpdateProfileDto,
    @Request() req
  ) {
    return this.authService.updateProfile(req.user.sub || req.user.userId, body);
  }

  // ==================== GOOGLE OAUTH ====================
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('google')
  async googleLogin(@Body() body: GoogleLoginDto, @Res({ passthrough: true }) response: Response) {
    const data = await this.authService.googleLogin(body.credential);
    this.setCookie(response, data.access_token);
    return data;
  }

  // ==================== FORGOT / RESET PASSWORD ====================
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // Stricter: 3 per minute
  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  // ==================== REFRESH TOKEN ====================
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Body() body: RefreshTokenDto, @Res({ passthrough: true }) response: Response) {
    const data = await this.authService.refreshToken(body.refresh_token);
    this.setCookie(response, data.access_token);
    return data;
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Body() body: LogoutDto, @Res({ passthrough: true }) response: Response) {
    response.clearCookie('auth_token');
    return this.authService.logout(body.refresh_token);
  }
}
