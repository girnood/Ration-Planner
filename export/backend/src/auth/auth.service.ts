import { Injectable } from '@nestjs/common';
import { PrismaClient, UserRole } from '@prisma/client';

// Simple mock service since we don't have the full Auth/JWT setup packages installed yet in this turn
// In a real app, this would use @nestjs/jwt and Passport

@Injectable()
export class AuthService {
  private prisma = new PrismaClient();

  async login(phone: string, role: UserRole = UserRole.CUSTOMER) {
    // 1. Find or Create User
    let user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone,
          role,
        },
      });
    }

    // 2. Mock Token Generation (return userId as token for simplicity in MVP)
    // Real world: return this.jwtService.sign({ sub: user.id, role: user.role });
    return {
      access_token: `mock_token_${user.id}`,
      user,
    };
  }
}
