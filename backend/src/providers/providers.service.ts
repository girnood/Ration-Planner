import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProviderStatus, VehicleType } from '@prisma/client';
import { CreateProviderProfileDto, UpdateProviderLocationDto, UpdateProviderStatusDto } from './dto/provider.dto';

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create provider profile (requires user to exist)
   */
  async createProfile(userId: string, data: CreateProviderProfileDto) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.role !== 'PROVIDER') {
      throw new BadRequestException('User role must be PROVIDER');
    }

    // Check if profile already exists
    const existingProfile = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new BadRequestException('Provider profile already exists');
    }

    return this.prisma.providerProfile.create({
      data: {
        userId,
        ...data,
      },
    });
  }

  /**
   * Get provider profile by user ID
   */
  async getProfile(userId: string) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException(`Provider profile not found for user ${userId}`);
    }

    return profile;
  }

  /**
   * Update provider location (for real-time tracking)
   */
  async updateLocation(userId: string, data: UpdateProviderLocationDto) {
    return this.prisma.providerProfile.update({
      where: { userId },
      data: {
        currentLat: data.lat,
        currentLng: data.lng,
      },
    });
  }

  /**
   * Update provider online status
   */
  async updateOnlineStatus(userId: string, isOnline: boolean) {
    return this.prisma.providerProfile.update({
      where: { userId },
      data: { isOnline },
    });
  }

  /**
   * Update provider approval status (Admin only)
   */
  async updateStatus(userId: string, data: UpdateProviderStatusDto) {
    return this.prisma.providerProfile.update({
      where: { userId },
      data: {
        status: data.status,
      },
    });
  }

  /**
   * Find available providers near a location
   * Used by dispatcher for Round Robin matching
   */
  async findAvailableProviders(lat: number, lng: number, radiusKm: number = 50) {
    // Get all online and approved providers
    const providers = await this.prisma.providerProfile.findMany({
      where: {
        isOnline: true,
        status: 'APPROVED',
        currentLat: { not: null },
        currentLng: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            isActive: true,
          },
        },
      },
    });

    // Filter by distance (simple distance calculation)
    // In production, use PostGIS ST_DWithin for efficient geospatial queries
    const nearbyProviders = providers
      .filter((provider) => {
        if (!provider.currentLat || !provider.currentLng) return false;
        const distance = this.calculateDistance(lat, lng, provider.currentLat, provider.currentLng);
        return distance <= radiusKm;
      })
      .sort((a, b) => {
        // Sort by distance (nearest first)
        const distA = this.calculateDistance(lat, lng, a.currentLat!, a.currentLng!);
        const distB = this.calculateDistance(lat, lng, b.currentLat!, b.currentLng!);
        return distA - distB;
      });

    return nearbyProviders;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
