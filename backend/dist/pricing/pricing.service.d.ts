export declare class PricingService {
    private readonly BASE_FARE;
    private readonly RATE_PER_KM;
    private readonly MINIMUM_FARE;
    calculatePrice(distanceInKm: number): number;
}
