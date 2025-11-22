import { Injectable } from '@nestjs/common';

@Injectable()
export class PricingService {
  private readonly BASE_FARE = 5.000;
  private readonly RATE_PER_KM = 0.350;
  private readonly MINIMUM_FARE = 5.000;

  /**
   * Calculates the tow service price based on distance.
   * Formula: Base Fare + (Distance * Rate)
   * Enforces Minimum Fare.
   * @param distanceInKm Distance in kilometers
   * @returns Price in OMR
   */
  calculatePrice(distanceInKm: number): number {
    let price = this.BASE_FARE + (distanceInKm * this.RATE_PER_KM);
    
    if (price < this.MINIMUM_FARE) {
      price = this.MINIMUM_FARE;
    }

    // Round to 3 decimal places for OMR
    return Math.round(price * 1000) / 1000;
  }
}
