import { Injectable } from '@nestjs/common';
import { MapsService } from '../maps/maps.service';

/**
 * Pricing Service for Munkith Roadside Assistance
 * 
 * Pricing Formula:
 * price = Base Fare + (Distance in KM * Rate per KM)
 * Minimum Fare = Base Fare (if calculated price is less)
 * 
 * Current Rates (OMR - Omani Rial):
 * - Base Fare: 5.000 OMR
 * - Rate per KM: 0.350 OMR
 * - Minimum Fare: 5.000 OMR
 */
@Injectable()
export class PricingService {
  private readonly BASE_FARE = 5.0; // OMR
  private readonly RATE_PER_KM = 0.35; // OMR per kilometer
  private readonly MINIMUM_FARE = 5.0; // OMR

  constructor(private readonly mapsService: MapsService) {}

  /**
   * Calculate the estimated price for a towing service
   * @param pickupLat - Pickup location latitude
   * @param pickupLng - Pickup location longitude
   * @param dropoffLat - Dropoff location latitude
   * @param dropoffLng - Dropoff location longitude
   * @returns Promise with estimated price in OMR
   */
  async calculatePrice(
    pickupLat: number,
    pickupLng: number,
    dropoffLat: number,
    dropoffLng: number,
  ): Promise<{ price: number; distanceKm: number }> {
    // Get distance from Google Maps Distance Matrix API
    const distanceKm = await this.mapsService.getDistanceInKm(
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng,
    );

    // Calculate price: Base Fare + (Distance * Rate)
    const calculatedPrice = this.BASE_FARE + distanceKm * this.RATE_PER_KM;

    // Ensure minimum fare
    const finalPrice = Math.max(calculatedPrice, this.MINIMUM_FARE);

    return {
      price: Number(finalPrice.toFixed(3)), // Round to 3 decimal places (OMR format)
      distanceKm: Number(distanceKm.toFixed(2)), // Round to 2 decimal places
    };
  }

  /**
   * Get pricing constants (for frontend display)
   */
  getPricingConstants() {
    return {
      baseFare: this.BASE_FARE,
      ratePerKm: this.RATE_PER_KM,
      minimumFare: this.MINIMUM_FARE,
      currency: 'OMR',
    };
  }
}
