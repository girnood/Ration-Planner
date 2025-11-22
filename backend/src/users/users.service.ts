import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UserRole } from '@prisma/client';

export interface CreateUserDto {
  phone: string;
  name?: string;
  email?: string;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find user by ID
   */
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        providerProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Find user by phone number
   */
  async findByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: { phone },
      include: {
        providerProfile: true,
      },
    });
  }

  /**
   * Create a new user
   */
  async create(data: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        phone: data.phone,
        name: data.name,
        email: data.email,
        role: data.role || UserRole.CUSTOMER,
        isActive: true,
      },
    });
  }

  /**
   * Update user profile
   */
  async update(id: string, data: Partial<CreateUserDto>) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Get all users (admin only)
   */
  async findAll(role?: UserRole) {
    return this.prisma.user.findMany({
      where: role ? { role } : undefined,
      include: {
        providerProfile: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Deactivate user
   */
  async deactivate(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Activate user
   */
  async activate(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });
  }
}
