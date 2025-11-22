import { Prisma, ProviderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
type NearbyProvider = {
    userId: string;
    distanceM: number;
};
export declare class ProvidersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createProfile(data: Prisma.ProviderProfileCreateInput): Promise<any>;
    markOnline(userId: string, isOnline: boolean): Promise<any>;
    updateStatus(userId: string, status: ProviderStatus): Promise<any>;
    updateDriverLocation(userId: string, lat: number, lng: number): Promise<void>;
    findNearestApprovedDrivers(lat: number, lng: number, limit?: number): Promise<NearbyProvider[]>;
}
export {};
