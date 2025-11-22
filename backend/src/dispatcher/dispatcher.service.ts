import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { OrderStatus } from '@prisma/client';
import { DispatcherGateway } from './dispatcher.gateway';

/**
 * Dispatcher Service - Implements Round Robin dispatching logic
 * 
 * Round Robin Algorithm:
 * 1. Find nearest available driver (online, approved, within radius)
 * 2. Send order offer to driver via WebSocket
 * 3. Wait 20 seconds for response
 * 4. If no response or rejected, move to next nearest driver
 * 5. Repeat until driver accepts or no more drivers available
 */
@Injectable()
export class DispatcherService {
  private readonly logger = new Logger(DispatcherService.name);
  private readonly OFFER_TIMEOUT_MS = 20000; // 20 seconds
  private activeOffers: Map<string, { 
    orderId: string; 
    driverId: string; 
    timeout: NodeJS.Timeout;
    resolve: (value: boolean) => void;
  }> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly providersService: ProvidersService,
    @Inject(forwardRef(() => DispatcherGateway))
    private readonly dispatcherGateway: DispatcherGateway,
  ) {}

  /**
   * Dispatch order to available drivers using Round Robin
   * @param orderId - Order ID to dispatch
   * @param pickupLat - Pickup latitude
   * @param pickupLng - Pickup longitude
   */
  async dispatchOrder(orderId: string, pickupLat: number, pickupLng: number) {
    this.logger.log(`Dispatching order ${orderId} from location (${pickupLat}, ${pickupLng})`);

    // Find available providers near pickup location
    const availableProviders = await this.providersService.findAvailableProviders(
      pickupLat,
      pickupLng,
      50, // 50km radius
    );

    if (availableProviders.length === 0) {
      this.logger.warn(`No available providers found for order ${orderId}`);
      // Update order status or notify customer
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });
      return;
    }

    // Try each provider in order (nearest first)
    for (const provider of availableProviders) {
      const driverId = provider.userId;
      const offerKey = `${orderId}-${driverId}`;

      // Check if order was already accepted
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order || order.status !== OrderStatus.SEARCHING) {
        this.logger.log(`Order ${orderId} is no longer searching, stopping dispatch`);
        return;
      }

      this.logger.log(`Offering order ${orderId} to driver ${driverId}`);

      // Get order details for the offer
      const orderDetails = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      // Emit offer event via WebSocket and wait for response
      const accepted = await this.offerOrderToDriver(orderId, driverId, orderDetails);

      if (accepted) {
        this.logger.log(`Driver ${driverId} accepted order ${orderId}`);
        // Update order with driver
        await this.prisma.order.update({
          where: { id: orderId },
          data: {
            driverId,
            status: OrderStatus.ACCEPTED,
          },
        });
        return;
      }

      this.logger.log(`Driver ${driverId} did not accept order ${orderId}, trying next driver`);
    }

    // No driver accepted
    this.logger.warn(`No driver accepted order ${orderId} after trying all available providers`);
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });
  }

  /**
   * Offer order to a specific driver and wait for response
   * Returns true if accepted, false if rejected or timeout
   */
  private async offerOrderToDriver(orderId: string, driverId: string, orderData: any): Promise<boolean> {
    return new Promise((resolve) => {
      const offerKey = `${orderId}-${driverId}`;

      // Set timeout for offer
      const timeout = setTimeout(() => {
        this.activeOffers.delete(offerKey);
        resolve(false);
      }, this.OFFER_TIMEOUT_MS);

      // Store active offer with resolve callback
      this.activeOffers.set(offerKey, {
        orderId,
        driverId,
        timeout,
        resolve, // Store resolve function
      } as any);

      // Send offer via WebSocket gateway
      this.dispatcherGateway.sendOrderOffer(orderId, driverId, orderData).catch((error) => {
        this.logger.error(`Error sending offer to driver ${driverId}:`, error);
        clearTimeout(timeout);
        this.activeOffers.delete(offerKey);
        resolve(false);
      });
    });
  }

  /**
   * Handle driver response to order offer
   * Called by DispatcherGateway when driver accepts/rejects
   */
  handleDriverResponse(orderId: string, driverId: string, accepted: boolean): boolean {
    const offerKey = `${orderId}-${driverId}`;
    const offer = this.activeOffers.get(offerKey);

    if (!offer) {
      this.logger.warn(`No active offer found for ${offerKey}`);
      return false;
    }

    // Clear timeout
    clearTimeout(offer.timeout);
    this.activeOffers.delete(offerKey);

    // Resolve the promise
    offer.resolve(accepted);

    return accepted;
  }

  /**
   * Get active offers (for debugging/monitoring)
   */
  getActiveOffers() {
    return Array.from(this.activeOffers.keys());
  }
}
