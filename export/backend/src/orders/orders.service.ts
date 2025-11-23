import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { PricingService } from '../pricing/pricing.service';
import { DispatcherGateway } from '../dispatcher/dispatcher.gateway';

@Injectable()
export class OrdersService {
  private prisma = new PrismaClient();

  constructor(
    private pricingService: PricingService,
    private dispatcherGateway: DispatcherGateway,
  ) {}

  async createOrder(data: {
    customerId: string;
    pickupLat: number;
    pickupLng: number;
    dropoffLat: number;
    dropoffLng: number;
  }) {
    // 1. Calculate Distance (Mock calculation for now using Euclidian or similar simple math if Google Maps not integrated yet)
    // In production, use Google Distance Matrix API
    const distanceKm = this.calculateDistance(
      data.pickupLat,
      data.pickupLng,
      data.dropoffLat,
      data.dropoffLng,
    );

    // 2. Calculate Price
    const price = this.pricingService.calculatePrice(distanceKm);

    // 3. Save to DB
    const order = await this.prisma.order.create({
      data: {
        customerId: data.customerId,
        pickup_lat: data.pickupLat,
        pickup_lng: data.pickupLng,
        dropoff_lat: data.dropoffLat,
        dropoff_lng: data.dropoffLng,
        price_estimated: price,
        status: OrderStatus.SEARCHING,
      },
    });

    // 4. Trigger Dispatcher
    // We pass the order details to the WebSocket gateway to start finding drivers
    // this.dispatcherGateway.dispatchJob({ ... }) - Logic to be refined
    
    return order;
  }

  // Haversine formula for distance (km)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
