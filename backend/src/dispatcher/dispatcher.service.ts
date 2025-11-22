import { Injectable, Logger } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { ProvidersService } from '../providers/providers.service';
import {
  FareBreakdown,
  PricingService,
} from '../pricing/pricing.service';
import { LocationUpdateDto } from './dto/location-update.dto';

const OFFER_TIMEOUT_MS = 20_000;

@Injectable()
export class DispatcherService {
  private readonly logger = new Logger(DispatcherService.name);
  private readonly driverQueue: string[] = [];
  private queuePointer = 0;

  constructor(
    private readonly ordersService: OrdersService,
    private readonly providersService: ProvidersService,
    private readonly pricingService: PricingService,
  ) {}

  async handleDriverLocationUpdate(dto: LocationUpdateDto) {
    await this.providersService.updateDriverLocation(
      dto.driverId,
      dto.lat,
      dto.lng,
    );

    if (typeof dto.isOnline === 'boolean') {
      await this.providersService.markOnline(dto.driverId, dto.isOnline);
      this.syncQueue(dto.driverId, dto.isOnline);
    }
  }

  async hydrateQueueFromPickup(pickup: { lat: number; lng: number }) {
    const candidates = await this.providersService.findNearestApprovedDrivers(
      pickup.lat,
      pickup.lng,
    );

    this.driverQueue.length = 0;
    this.driverQueue.push(...candidates.map((candidate) => candidate.userId));
    this.queuePointer = 0;

    return candidates;
  }

  async estimateFare(distanceKm: number): Promise<FareBreakdown> {
    return this.pricingService.calculateFare(distanceKm);
  }

  /**
   * Round-robin dispatching strategy:
   * 1. maintain an in-memory queue of online drivers ordered by their last
   *    matching result (nearest first when hydrated).
   * 2. whenever an order is created we advance the queue pointer and offer the
   *    job to the next driver.
   * 3. if a driver declines or does not answer within 20 seconds
   *    (OFFER_TIMEOUT_MS), we move on to the next driver. This guarantees fair
   *    distribution while still preferring proximity thanks to step #1.
   */
  async dispatchOrder(orderId: string) {
    if (!this.driverQueue.length) {
      this.logger.warn(`No drivers available for order ${orderId}`);
      return null;
    }

    const attempts = this.driverQueue.length;
    for (let i = 0; i < attempts; i += 1) {
      const driverId = this.nextDriver();
      if (!driverId) {
        break;
      }

      this.logger.debug(
        `Offering order ${orderId} to driver ${driverId} for up to ${OFFER_TIMEOUT_MS}ms`,
      );

      // TODO: integrate Socket.IO room messaging / notifications here.
      // For now we only log the offer. The gateway will emit events.
    }

    return null;
  }

  private syncQueue(driverId: string, isOnline: boolean) {
    const currentIndex = this.driverQueue.indexOf(driverId);
    if (!isOnline && currentIndex >= 0) {
      this.driverQueue.splice(currentIndex, 1);
      this.queuePointer = this.driverQueue.length
        ? this.queuePointer % this.driverQueue.length
        : 0;
      return;
    }

    if (isOnline && currentIndex === -1) {
      this.driverQueue.push(driverId);
    }
  }

  private nextDriver(): string | null {
    if (!this.driverQueue.length) {
      return null;
    }

    const driverId = this.driverQueue[this.queuePointer];
    this.queuePointer = (this.queuePointer + 1) % this.driverQueue.length;
    return driverId;
  }

  getQueueSnapshot() {
    return [...this.driverQueue];
  }
}
