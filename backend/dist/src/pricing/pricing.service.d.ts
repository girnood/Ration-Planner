import { ConfigService } from '@nestjs/config';
export type FareBreakdown = {
    base: number;
    distanceKm: number;
    perKmRate: number;
    subtotal: number;
    total: number;
};
export declare class PricingService {
    private readonly configService;
    private readonly baseFare;
    private readonly perKmRate;
    private readonly minimumFare;
    constructor(configService: ConfigService);
    calculateFare(distanceKm: number): FareBreakdown;
    private getNumericEnv;
}
