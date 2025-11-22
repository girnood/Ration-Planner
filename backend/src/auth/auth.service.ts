import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string; // User ID
  phone: string;
  role: UserRole;
}

/**
 * AuthService
 * 
 * Handles authentication via phone number verification.
 * For MVP, uses mock SMS verification code.
 * 
 * Flow:
 * 1. User sends phone number
 * 2. System generates verification code (mock: always 123456)
 * 3. User enters code
 * 4. System validates and returns JWT token
 */
@Injectable()
export class AuthService {
  private readonly mockVerificationCode: string;
  
  // Store pending verifications (in production, use Redis)
  private pendingVerifications: Map<string, { code: string; expiresAt: Date }> = new Map();

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {
    this.mockVerificationCode = this.configService.get('SMS_VERIFICATION_CODE', '123456');
  }

  /**
   * Send verification code to phone number
   * In MVP, this is mocked and always returns 123456
   */
  async sendVerificationCode(phone: string): Promise<{ success: boolean; message: string }> {
    // Normalize phone number (add +968 prefix for Oman if not present)
    const normalizedPhone = this.normalizePhone(phone);

    // Generate verification code (mock for MVP)
    const code = this.mockVerificationCode;
    
    // Store in memory with 5-minute expiration
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);
    
    this.pendingVerifications.set(normalizedPhone, {
      code,
      expiresAt,
    });

    // In production, send SMS via Twilio, AWS SNS, or local SMS gateway
    console.log(`📱 SMS sent to ${normalizedPhone}: ${code}`);

    return {
      success: true,
      message: `Verification code sent to ${normalizedPhone} (Mock: ${code})`,
    };
  }

  /**
   * Verify the code and create/login user
   */
  async verifyCode(
    phone: string,
    code: string,
    name?: string,
    role: UserRole = UserRole.CUSTOMER,
  ): Promise<{ accessToken: string; user: any }> {
    const normalizedPhone = this.normalizePhone(phone);

    // Check if verification code exists and is valid
    const verification = this.pendingVerifications.get(normalizedPhone);
    
    if (!verification) {
      throw new UnauthorizedException('No verification code sent to this number');
    }

    if (new Date() > verification.expiresAt) {
      this.pendingVerifications.delete(normalizedPhone);
      throw new UnauthorizedException('Verification code expired');
    }

    if (verification.code !== code) {
      throw new UnauthorizedException('Invalid verification code');
    }

    // Clear the verification
    this.pendingVerifications.delete(normalizedPhone);

    // Find or create user
    let user = await this.usersService.findByPhone(normalizedPhone);
    
    if (!user) {
      user = await this.usersService.create({
        phone: normalizedPhone,
        name: name || null,
        role,
      });
    }

    // Generate JWT token
    const accessToken = this.generateToken(user);

    return {
      accessToken,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
    };
  }

  /**
   * Generate JWT token for user
   */
  generateToken(user: any): string {
    const payload: JwtPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Validate JWT token
   */
  async validateToken(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }

  /**
   * Normalize phone number (add Oman country code if missing)
   */
  private normalizePhone(phone: string): string {
    // Remove spaces and dashes
    let normalized = phone.replace(/[\s-]/g, '');

    // Add +968 if not present
    if (!normalized.startsWith('+')) {
      if (normalized.startsWith('968')) {
        normalized = '+' + normalized;
      } else {
        normalized = '+968' + normalized;
      }
    }

    return normalized;
  }

  /**
   * Refresh token (for future use)
   */
  async refreshToken(userId: string): Promise<string> {
    const user = await this.usersService.findById(userId);
    
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return this.generateToken(user);
  }
}
