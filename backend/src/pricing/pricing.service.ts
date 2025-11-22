import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PRICING_DEFAULTS } from './pricing.constants';

export type FareBreakdown = {
  base: number;
  distanceKm: number;
  perKmRate: number;
  subtotal: number;
  total: number;
};

@Injectable()
export class PricingService {
  private readonly baseFare: number;
  private readonly perKmRate: number;
  private readonly minimumFare: number;

  constructor(private readonly configService: ConfigService) {
    this.baseFare = this.getNumericEnv(
      'PRICING_BASE_FARE',
      PRICING_DEFAULTS.baseFare,
    );
    this.perKmRate = this.getNumericEnv(
      'PRICING_PER_KM_RATE',
      PRICING_DEFAULTS.perKmRate,
    );
    this.minimumFare = this.getNumericEnv(
      'PRICING_MIN_FARE',
      PRICING_DEFAULTS.minimumFare,
    );
  }

  /**
   * Calculates the towing fare using the MVP formula:
   *   price = base + (distanceKm * rate)
   * A minimum fare guard ensures we never go below 5 OMR.
   */
  calculateFare(distanceKm: number): FareBreakdown {
    const normalizedDistance = Math.max(0, distanceKm);
    const subtotal = this.baseFare + normalizedDistance * this.perKmRate;
    const total = Math.max(subtotal, this.minimumFare);

    return {
      base: this.baseFare,
      distanceKm: normalizedDistance,
      perKmRate: this.perKmRate,
      subtotal,
      total,
    };
  }

  private getNumericEnv(key: string, fallback: number): number {
    const value = this.configService.get<string>(key);
    if (!value) {
      return fallback;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
}
