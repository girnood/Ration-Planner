import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

/**
 * Auth Service - Handles authentication and authorization
 * Supports phone number verification (mock SMS for development)
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Generate OTP for phone verification (Mock implementation)
   * In production, integrate with SMS service like Twilio, AWS SNS, etc.
   */
  async generateOTP(phone: string): Promise<string> {
    // Mock OTP generation - always returns "123456" for development
    // In production, generate random 6-digit code and send via SMS
    const otp = '123456';
    console.log(`[MOCK SMS] OTP for ${phone}: ${otp}`);
    return otp;
  }

  /**
   * Verify phone number with OTP
   */
  async verifyPhone(phone: string, otp: string): Promise<boolean> {
    // Mock verification - accepts "123456" for any phone
    // In production, verify against stored OTP with expiration
    return otp === '123456';
  }

  /**
   * Register or login user with phone number
   */
  async loginWithPhone(phone: string, otp: string) {
    const isValid = await this.verifyPhone(phone, otp);
    if (!isValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Find or create user
    let user = await this.usersService.findByPhone(phone);
    if (!user) {
      user = await this.usersService.create({
        phone,
        role: 'CUSTOMER',
      });
    }

    // Generate JWT token
    const payload = { sub: user.id, phone: user.phone, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  /**
   * Validate JWT token payload
   */
  async validateUser(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return user;
  }
}
