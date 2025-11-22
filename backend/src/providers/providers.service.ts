import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProviderProfileDto } from './dto/create-provider-profile.dto';

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  async createProfile(dto: CreateProviderProfileDto) {
    const profile = await this.prisma.providerProfile.create({
      data: {
        userId: dto.userId,
        vehicleType: dto.vehicleType,
        plateNumber: dto.plateNumber,
        status: dto.status,
        isOnline: dto.isOnline,
        currentLat: dto.lat ?? null,
        currentLng: dto.lng ?? null,
      },
    });

    if (dto.lat !== undefined && dto.lng !== undefined) {
      await this.prisma.$executeRawUnsafe(
        `UPDATE "ProviderProfile" SET "currentLocation" = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE "id" = $3`,
        dto.lng,
        dto.lat,
        profile.id,
      );
    }

    return profile;
  }

  findByUserId(userId: string) {
    return this.prisma.providerProfile.findUnique({
      where: { userId },
    });
  }

  async updateLocation(userId: string, lat: number, lng: number) {
    await this.prisma.$executeRawUnsafe(
      `UPDATE "ProviderProfile" SET "currentLocation" = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE "userId" = $3`,
      lng,
      lat,
      userId,
    );

    return this.prisma.providerProfile.update({
      where: { userId },
      data: {
        currentLat: lat,
        currentLng: lng,
      },
    });
  }
}
