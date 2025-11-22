import { Injectable } from '@nestjs/common';
import { Prisma, ProviderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type NearbyProvider = {
  userId: string;
  distanceM: number;
};

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  async createProfile(data: Prisma.ProviderProfileCreateInput) {
    return this.prisma.providerProfile.create({ data });
  }

  async markOnline(userId: string, isOnline: boolean) {
    return this.prisma.providerProfile.update({
      where: { userId },
      data: { isOnline },
    });
  }

  async updateStatus(userId: string, status: ProviderStatus) {
    return this.prisma.providerProfile.update({
      where: { userId },
      data: { status },
    });
  }

  async updateDriverLocation(userId: string, lat: number, lng: number) {
    await this.prisma.$executeRaw`
      UPDATE "ProviderProfile"
      SET "currentLocation" = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          "lastPingAt" = NOW()
      WHERE "userId" = ${userId}
    `;
  }

  async findNearestApprovedDrivers(
    lat: number,
    lng: number,
    limit = 10,
  ): Promise<NearbyProvider[]> {
    const rows = await this.prisma.$queryRaw<
      Array<{ userId: string; distance_m: number }>
    >`
      SELECT "userId",
        ST_Distance(
          "currentLocation",
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        ) AS distance_m
      FROM "ProviderProfile"
      WHERE "isOnline" = true
        AND "status" = ${ProviderStatus.APPROVED}
        AND "currentLocation" IS NOT NULL
      ORDER BY distance_m ASC
      LIMIT ${limit}
    `;

    return rows.map((row) => ({
      userId: row.userId,
      distanceM: row.distance_m,
    }));
  }
}
