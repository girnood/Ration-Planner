import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { providerProfile: true },
    });
  }

  async findByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: { phone },
      include: { providerProfile: true },
    });
  }

  async ensureUser(phone: string, role: UserRole = UserRole.CUSTOMER) {
    const existing = await this.findByPhone(phone);
    if (existing) {
      return existing;
    }

    return this.createUser({
      phone,
      role,
    });
  }
}
