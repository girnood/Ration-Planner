import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, DistanceMatrixRequest, UnitSystem } from '@googlemaps/google-maps-services-js';

/**
 * Maps Service - Integration with Google Maps Platform
 * Handles distance calculations, directions, and geocoding
 */
@Injectable()
export class MapsService {
  private readonly googleMapsClient: Client;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY') || '';
    this.googleMapsClient = new Client({});
  }

  /**
   * Get distance between two points in kilometers using Google Distance Matrix API
   * @param pickupLat - Pickup latitude
   * @param pickupLng - Pickup longitude
   * @param dropoffLat - Dropoff latitude
   * @param dropoffLng - Dropoff longitude
   * @returns Distance in kilometers
   */
  async getDistanceInKm(
    pickupLat: number,
    pickupLng: number,
    dropoffLat: number,
    dropoffLng: number,
  ): Promise<number> {
    if (!this.apiKey) {
      // Fallback: Calculate straight-line distance (Haversine formula)
      // In production, always use Google Maps API for accurate road distance
      console.warn('Google Maps API key not configured. Using Haversine formula as fallback.');
      return this.calculateHaversineDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);
    }

    try {
      const request: DistanceMatrixRequest = {
        params: {
          origins: [{ lat: pickupLat, lng: pickupLng }],
          destinations: [{ lat: dropoffLat, lng: dropoffLng }],
          key: this.apiKey,
          units: UnitSystem.metric,
        },
      };

      const response = await this.googleMapsClient.distancematrix(request);

      if (
        response.data.rows?.[0]?.elements?.[0]?.status === 'OK' &&
        response.data.rows[0].elements[0].distance
      ) {
        // Convert meters to kilometers
        const distanceMeters = response.data.rows[0].elements[0].distance.value;
        return distanceMeters / 1000;
      }

      // Fallback to Haversine if API fails
      return this.calculateHaversineDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);
    } catch (error) {
      console.error('Error fetching distance from Google Maps API:', error);
      // Fallback to Haversine formula
      return this.calculateHaversineDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);
    }
  }

  /**
   * Calculate straight-line distance using Haversine formula (fallback)
   * Note: This is less accurate than road distance from Google Maps
   */
  private calculateHaversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
