import { Injectable } from '@nestjs/common';

const BASE_FARE_OMR = 5.0;
const RATE_PER_KM_OMR = 0.35;
const MINIMUM_FARE_OMR = 5.0;

@Injectable()
export class PricingService {
  /**
   * Calculates the final fare in OMR.
   * @param distanceKm Driven distance in kilometers.
   */
  calculate(distanceKm: number): number {
    const variable = distanceKm * RATE_PER_KM_OMR;
    const price = BASE_FARE_OMR + variable;
    return Math.max(price, MINIMUM_FARE_OMR);
  }
}
