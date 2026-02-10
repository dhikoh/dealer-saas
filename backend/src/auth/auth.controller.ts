import { Controller, Post, Body, HttpCode, HttpStatus, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { Public } from './public.decorator';
import { AllowUnonboarded } from './user-state.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('register')
  register(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.register(createAuthDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() loginDto: Record<string, any>) {
    return this.authService.login(loginDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('verify')
  verify(@Body() body: { email: string; code: string }) {
    return this.authService.verifyEmail(body.email, body.code);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('resend-otp')
  resendOtp(@Body() body: { email: string }) {
    return this.authService.resendVerificationCode(body.email);
  }

  // Protected: Requires authentication + allows unverified → verified unonboarded users
  @AllowUnonboarded()
  @Post('onboarding')
  async onboarding(@Body() body: {
    fullName: string;
    phone: string;
    dealerName: string;
    birthDate: string;
    domicileAddress: string;
    officeAddress: string;
    language: string;
  }, @Request() req) {
    return this.authService.completeOnboarding(req.user.userId, {
      fullName: body.fullName,
      phone: body.phone,
      dealerName: body.dealerName,
      birthDate: body.birthDate,
      domicileAddress: body.domicileAddress,
      officeAddress: body.officeAddress,
      language: body.language
    });
  }

  // Protected: Requires authentication
  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  async changePassword(
    @Body() body: { currentPassword: string; newPassword: string },
    @Request() req
  ) {
    return this.authService.changePassword(req.user.sub, body.currentPassword, body.newPassword);
  }

  // ==================== GOOGLE OAUTH ====================
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('google')
  async googleLogin(@Body() body: { credential: string }) {
    return this.authService.googleLogin(body.credential);
  }

  // ==================== FORGOT / RESET PASSWORD ====================
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }
}

