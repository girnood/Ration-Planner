"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvidersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let ProvidersService = class ProvidersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createProfile(data) {
        return this.prisma.providerProfile.create({ data });
    }
    async markOnline(userId, isOnline) {
        return this.prisma.providerProfile.update({
            where: { userId },
            data: { isOnline },
        });
    }
    async updateStatus(userId, status) {
        return this.prisma.providerProfile.update({
            where: { userId },
            data: { status },
        });
    }
    async updateDriverLocation(userId, lat, lng) {
        await this.prisma.$executeRaw `
      UPDATE "ProviderProfile"
      SET "currentLocation" = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          "lastPingAt" = NOW()
      WHERE "userId" = ${userId}
    `;
    }
    async findNearestApprovedDrivers(lat, lng, limit = 10) {
        const rows = await this.prisma.$queryRaw `
      SELECT "userId",
        ST_Distance(
          "currentLocation",
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        ) AS distance_m
      FROM "ProviderProfile"
      WHERE "isOnline" = true
        AND "status" = ${client_1.ProviderStatus.APPROVED}
        AND "currentLocation" IS NOT NULL
      ORDER BY distance_m ASC
      LIMIT ${limit}
    `;
        return rows.map((row) => ({
            userId: row.userId,
            distanceM: row.distance_m,
        }));
    }
};
exports.ProvidersService = ProvidersService;
exports.ProvidersService = ProvidersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProvidersService);
//# sourceMappingURL=providers.service.js.map