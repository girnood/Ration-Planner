import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { phone: string; role?: 'CUSTOMER' | 'PROVIDER' }) {
    if (!body.phone) {
      throw new BadRequestException('Phone number is required');
    }
    return this.authService.login(body.phone, body.role as any);
  }
}
