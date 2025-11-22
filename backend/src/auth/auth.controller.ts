import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto, VerifyOtpDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Request OTP for phone verification
   */
  @Post('request-otp')
  async requestOTP(@Body() dto: { phone: string }) {
    const otp = await this.authService.generateOTP(dto.phone);
    return {
      message: 'OTP sent successfully',
      // In production, don't return OTP. Only return it in development/mock mode
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    };
  }

  /**
   * Verify OTP and login/register
   */
  @Post('verify-otp')
  async verifyOTP(@Body() dto: VerifyOtpDto) {
    return this.authService.loginWithPhone(dto.phone, dto.otp);
  }

  /**
   * Get current user profile
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    return req.user;
  }
}
