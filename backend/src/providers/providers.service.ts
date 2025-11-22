import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { MapsService } from '../maps/maps.service';
import { ProviderStatus, VehicleType } from '@prisma/client';

export interface CreateProviderDto {
  userId: string;
  vehicleType: VehicleType;
  plateNumber: string;
  licenseNumber?: string;
  vehicleModel?: string;
  vehicleYear?: number;
}

export interface UpdateLocationDto {
  lat: number;
  lng: number;
}

/**
 * ProvidersService
 * 
 * Manages provider (driver) profiles and operations.
 * Handles approval workflow, location updates, and online/offline status.
 */
@Injectable()
export class ProvidersService {
  constructor(
    private prisma: PrismaService,
    private mapsService: MapsService,
  ) {}

  /**
   * Create a new provider profile
   * Status will be PENDING until admin approval
   */
  async create(data: CreateProviderDto) {
    // Check if user already has a provider profile
    const existing = await this.prisma.provider.findUnique({
      where: { userId: data.userId },
    });

    if (existing) {
      throw new BadRequestException('User already has a provider profile');
    }

    return this.prisma.provider.create({
      data: {
        userId: data.userId,
        vehicleType: data.vehicleType,
        plateNumber: data.plateNumber,
        licenseNumber: data.licenseNumber,
        vehicleModel: data.vehicleModel,
        vehicleYear: data.vehicleYear,
        status: ProviderStatus.PENDING,
        isOnline: false,
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * Get provider by ID
   */
  async findById(id: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!provider) {
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }

    return provider;
  }

  /**
   * Get provider by user ID
   */
  async findByUserId(userId: string) {
    return this.prisma.provider.findUnique({
      where: { userId },
      include: {
        user: true,
      },
    });
  }

  /**
   * Get all providers
   */
  async findAll(status?: ProviderStatus, isOnline?: boolean) {
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (isOnline !== undefined) {
      where.isOnline = isOnline;
    }

    return this.prisma.provider.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Find available providers near a location
   * Returns providers sorted by distance (nearest first)
   */
  async findAvailableNear(lat: number, lng: number, maxDistanceKm: number = 50) {
    // Get all online and approved providers
    const providers = await this.prisma.provider.findMany({
      where: {
        status: ProviderStatus.APPROVED,
        isOnline: true,
        currentLat: { not: null },
        currentLng: { not: null },
      },
      include: {
        user: true,
      },
    });

    if (providers.length === 0) {
      return [];
    }

    // Calculate distance for each provider
    const providersWithDistance = providers.map((provider) => {
      const distance = this.mapsService.calculateHaversineDistance(
        { lat, lng },
        { lat: provider.currentLat!, lng: provider.currentLng! },
      );

      return {
        ...provider,
        distanceKm: distance,
      };
    });

    // Filter by max distance and sort by distance
    return providersWithDistance
      .filter((p) => p.distanceKm <= maxDistanceKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  /**
   * Update provider location
   */
  async updateLocation(userId: string, location: UpdateLocationDto) {
    const provider = await this.findByUserId(userId);

    if (!provider) {
      throw new NotFoundException('Provider profile not found');
    }

    return this.prisma.provider.update({
      where: { id: provider.id },
      data: {
        currentLat: location.lat,
        currentLng: location.lng,
        currentLocation: `POINT(${location.lng} ${location.lat})`, // PostGIS format
      },
    });
  }

  /**
   * Set provider online/offline status
   */
  async setOnlineStatus(userId: string, isOnline: boolean) {
    const provider = await this.findByUserId(userId);

    if (!provider) {
      throw new NotFoundException('Provider profile not found');
    }

    if (provider.status !== ProviderStatus.APPROVED) {
      throw new BadRequestException('Provider is not approved');
    }

    return this.prisma.provider.update({
      where: { id: provider.id },
      data: { isOnline },
    });
  }

  /**
   * Approve provider (admin only)
   */
  async approve(id: string) {
    return this.prisma.provider.update({
      where: { id },
      data: { status: ProviderStatus.APPROVED },
    });
  }

  /**
   * Reject provider (admin only)
   */
  async reject(id: string) {
    return this.prisma.provider.update({
      where: { id },
      data: { status: ProviderStatus.REJECTED },
    });
  }

  /**
   * Suspend provider (admin only)
   */
  async suspend(id: string) {
    return this.prisma.provider.update({
      where: { id },
      data: { 
        status: ProviderStatus.SUSPENDED,
        isOnline: false,
      },
    });
  }

  /**
   * Update provider profile
   */
  async update(id: string, data: Partial<CreateProviderDto>) {
    return this.prisma.provider.update({
      where: { id },
      data,
      include: {
        user: true,
      },
    });
  }

  /**
   * Get provider statistics
   */
  async getStats(id: string) {
    const provider = await this.findById(id);

    const completedOrders = await this.prisma.order.count({
      where: {
        driverId: provider.userId,
        status: 'COMPLETED',
      },
    });

    const totalEarnings = await this.prisma.order.aggregate({
      where: {
        driverId: provider.userId,
        status: 'COMPLETED',
      },
      _sum: {
        priceFinal: true,
      },
    });

    return {
      totalOrders: completedOrders,
      totalEarnings: totalEarnings._sum.priceFinal || 0,
      rating: provider.rating,
      vehicleType: provider.vehicleType,
      status: provider.status,
    };
  }
}
