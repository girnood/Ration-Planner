import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import { UserRole } from '@prisma/client';

class SendCodeDto {
  phone: string;
}

class VerifyCodeDto {
  phone: string;
  code: string;
  name?: string;
  role?: UserRole;
}

/**
 * AuthController
 * 
 * Handles authentication endpoints:
 * - POST /auth/send-code - Send verification code
 * - POST /auth/verify - Verify code and login/register
 */
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Send verification code to phone number
   * 
   * @body phone - Phone number (with or without country code)
   */
  @Public()
  @Post('send-code')
  @HttpCode(HttpStatus.OK)
  async sendCode(@Body() dto: SendCodeDto) {
    return this.authService.sendVerificationCode(dto.phone);
  }

  /**
   * Verify code and login/register user
   * 
   * @body phone - Phone number
   * @body code - Verification code
   * @body name - User name (optional, for new users)
   * @body role - User role (optional, defaults to CUSTOMER)
   */
  @Public()
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(@Body() dto: VerifyCodeDto) {
    return this.authService.verifyCode(
      dto.phone,
      dto.code,
      dto.name,
      dto.role || UserRole.CUSTOMER,
    );
  }
}
