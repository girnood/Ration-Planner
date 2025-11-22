import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, DistanceMatrixResponse } from '@googlemaps/google-maps-services-js';

export interface Location {
  lat: number;
  lng: number;
}

export interface DistanceResult {
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  durationMinutes: number;
}

/**
 * MapsService
 * 
 * Integrates with Google Maps Platform for:
 * - Distance calculations
 * - Geocoding
 * - Route planning
 */
@Injectable()
export class MapsService {
  private readonly client: Client;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get('GOOGLE_MAPS_API_KEY', '');
    this.client = new Client({});
  }

  /**
   * Calculate distance between two points using Google Distance Matrix API
   * 
   * @param origin - Starting location
   * @param destination - Ending location
   * @returns Distance and duration information
   */
  async calculateDistance(
    origin: Location,
    destination: Location,
  ): Promise<DistanceResult> {
    try {
      const response: DistanceMatrixResponse = await this.client.distancematrix({
        params: {
          origins: [`${origin.lat},${origin.lng}`],
          destinations: [`${destination.lat},${destination.lng}`],
          key: this.apiKey,
          mode: 'driving',
        },
      });

      const element = response.data.rows[0].elements[0];

      if (element.status !== 'OK') {
        throw new Error(`Distance calculation failed: ${element.status}`);
      }

      const distanceMeters = element.distance.value;
      const durationSeconds = element.duration.value;

      return {
        distanceMeters,
        distanceKm: this.metersToKilometers(distanceMeters),
        durationSeconds,
        durationMinutes: Math.round(durationSeconds / 60),
      };
    } catch (error) {
      console.error('Error calculating distance:', error);
      
      // Fallback to Haversine formula for basic distance calculation
      const distanceKm = this.calculateHaversineDistance(origin, destination);
      
      return {
        distanceMeters: Math.round(distanceKm * 1000),
        distanceKm,
        durationSeconds: 0,
        durationMinutes: 0,
      };
    }
  }

  /**
   * Calculate straight-line distance using Haversine formula
   * Used as fallback when Google Maps API is unavailable
   * 
   * @param point1 - First location
   * @param point2 - Second location
   * @returns Distance in kilometers
   */
  calculateHaversineDistance(point1: Location, point2: Location): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degreesToRadians(point2.lat - point1.lat);
    const dLng = this.degreesToRadians(point2.lng - point1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(point1.lat)) *
        Math.cos(this.degreesToRadians(point2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Find nearest provider to a location
   * 
   * @param location - Target location
   * @param providers - Array of provider locations
   * @returns Array of providers sorted by distance (nearest first)
   */
  async findNearestProviders(
    location: Location,
    providers: Array<{ id: string; location: Location }>,
  ): Promise<Array<{ id: string; distanceKm: number }>> {
    const results = await Promise.all(
      providers.map(async (provider) => {
        const distance = this.calculateHaversineDistance(location, provider.location);
        return {
          id: provider.id,
          distanceKm: distance,
        };
      }),
    );

    // Sort by distance (nearest first)
    return results.sort((a, b) => a.distanceKm - b.distanceKm);
  }

  /**
   * Convert meters to kilometers
   */
  private metersToKilometers(meters: number): number {
    return Math.round((meters / 1000) * 100) / 100;
  }

  /**
   * Convert degrees to radians
   */
  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Geocode an address to coordinates
   * (Placeholder - implement when needed)
   */
  async geocodeAddress(address: string): Promise<Location | null> {
    try {
      const response = await this.client.geocode({
        params: {
          address,
          key: this.apiKey,
        },
      });

      if (response.data.results.length === 0) {
        return null;
      }

      const location = response.data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
      };
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to address
   * (Placeholder - implement when needed)
   */
  async reverseGeocode(location: Location): Promise<string | null> {
    try {
      const response = await this.client.reverseGeocode({
        params: {
          latlng: `${location.lat},${location.lng}`,
          key: this.apiKey,
        },
      });

      if (response.data.results.length === 0) {
        return null;
      }

      return response.data.results[0].formatted_address;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }
}
