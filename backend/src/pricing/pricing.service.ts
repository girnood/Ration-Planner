import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * PricingService
 * 
 * Implements the pricing formula for roadside assistance services in Oman.
 * All prices are in OMR (Omani Rial).
 * 
 * Formula: Price = Base Fare + (Distance in KM × Rate per KM)
 * 
 * Default Configuration:
 * - Base Fare: 5.000 OMR
 * - Rate per KM: 0.350 OMR
 * - Minimum Fare: 5.000 OMR
 */
@Injectable()
export class PricingService {
  private readonly baseFare: number;
  private readonly ratePerKm: number;
  private readonly minimumFare: number;

  constructor(private configService: ConfigService) {
    // Load pricing configuration from environment variables
    this.baseFare = parseFloat(this.configService.get('BASE_FARE', '5.0'));
    this.ratePerKm = parseFloat(this.configService.get('RATE_PER_KM', '0.35'));
    this.minimumFare = parseFloat(this.configService.get('MINIMUM_FARE', '5.0'));
  }

  /**
   * Calculate the estimated price for a towing service
   * 
   * @param distanceKm - Distance in kilometers
   * @returns Calculated price in OMR
   */
  calculatePrice(distanceKm: number): number {
    // Formula: Base Fare + (Distance × Rate per KM)
    const calculatedPrice = this.baseFare + (distanceKm * this.ratePerKm);

    // Ensure price doesn't go below minimum fare
    const finalPrice = Math.max(calculatedPrice, this.minimumFare);

    // Round to 3 decimal places (standard for OMR)
    return this.roundToThreeDecimals(finalPrice);
  }

  /**
   * Get the base fare
   */
  getBaseFare(): number {
    return this.baseFare;
  }

  /**
   * Get the rate per kilometer
   */
  getRatePerKm(): number {
    return this.ratePerKm;
  }

  /**
   * Get the minimum fare
   */
  getMinimumFare(): number {
    return this.minimumFare;
  }

  /**
   * Get a pricing breakdown for display
   */
  getPricingBreakdown(distanceKm: number): {
    baseFare: number;
    ratePerKm: number;
    distance: number;
    distanceCost: number;
    subtotal: number;
    minimumFare: number;
    totalPrice: number;
  } {
    const distanceCost = this.roundToThreeDecimals(distanceKm * this.ratePerKm);
    const subtotal = this.roundToThreeDecimals(this.baseFare + distanceCost);
    const totalPrice = Math.max(subtotal, this.minimumFare);

    return {
      baseFare: this.baseFare,
      ratePerKm: this.ratePerKm,
      distance: this.roundToThreeDecimals(distanceKm),
      distanceCost,
      subtotal,
      minimumFare: this.minimumFare,
      totalPrice: this.roundToThreeDecimals(totalPrice),
    };
  }

  /**
   * Round a number to 3 decimal places (OMR standard)
   */
  private roundToThreeDecimals(value: number): number {
    return Math.round(value * 1000) / 1000;
  }

  /**
   * Format price as string with OMR currency
   */
  formatPrice(price: number): string {
    return `${this.roundToThreeDecimals(price).toFixed(3)} OMR`;
  }
}
