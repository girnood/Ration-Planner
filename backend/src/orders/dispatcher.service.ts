import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from './orders.service';
import { ProvidersService } from '../providers/providers.service';
import { DispatcherGateway } from '../websocket/dispatcher.gateway';
import { OrderStatus } from '@prisma/client';

/**
 * DispatcherService
 * 
 * Implements the Round Robin dispatching algorithm for driver matching.
 * 
 * ROUND ROBIN DISPATCHING LOGIC:
 * 
 * When a customer creates an order:
 * 1. Find all available drivers near the pickup location (within 50km)
 * 2. Sort drivers by distance (nearest first)
 * 3. Offer the order to the nearest driver
 * 4. Wait for driver response (20 seconds timeout by default)
 * 5. If driver accepts: Assign order and notify customer
 * 6. If driver rejects or timeout: Move to next nearest driver
 * 7. Repeat steps 3-6 until a driver accepts or all drivers are exhausted
 * 8. If no driver accepts after MAX_ATTEMPTS: Mark order as failed
 * 
 * KEY FEATURES:
 * - Fair distribution: Drivers are tried in order of proximity
 * - Timeout handling: Automatic fallback if driver doesn't respond
 * - History tracking: Record all dispatch attempts for analytics
 * - Real-time updates: WebSocket notifications to all parties
 */
@Injectable()
export class DispatcherService {
  private readonly logger = new Logger(DispatcherService.name);
  
  // Configuration
  private readonly driverResponseTimeout: number; // Milliseconds
  private readonly maxDispatchAttempts: number;
  
  // Track pending offers (orderId -> timeoutId)
  private pendingOffers: Map<string, NodeJS.Timeout> = new Map();
  
  // Track which order each driver is currently considering
  private driverOffers: Map<string, string> = new Map(); // driverId -> orderId

  constructor(
    private ordersService: OrdersService,
    private providersService: ProvidersService,
    private dispatcherGateway: DispatcherGateway,
    private configService: ConfigService,
  ) {
    this.driverResponseTimeout = parseInt(
      this.configService.get('DRIVER_RESPONSE_TIMEOUT', '20000'),
    );
    this.maxDispatchAttempts = parseInt(
      this.configService.get('MAX_DISPATCH_ATTEMPTS', '5'),
    );
  }

  /**
   * Start dispatching an order to available drivers
   * This is the main entry point for the Round Robin algorithm
   * 
   * @param orderId - ID of the order to dispatch
   */
  async startDispatching(orderId: string): Promise<void> {
    this.logger.log(`🚀 Starting dispatch for order ${orderId}`);

    try {
      // Get order details
      const order = await this.ordersService.findById(orderId);

      if (order.status !== OrderStatus.SEARCHING) {
        this.logger.warn(`Order ${orderId} is not in SEARCHING status`);
        return;
      }

      // Find available drivers near pickup location
      const availableDrivers = await this.providersService.findAvailableNear(
        order.pickupLat,
        order.pickupLng,
        50, // 50km radius
      );

      if (availableDrivers.length === 0) {
        this.logger.error(`No available drivers found for order ${orderId}`);
        
        // Notify customer
        this.dispatcherGateway.notifyCustomer(order.customerId, 'order:no-drivers', {
          orderId,
          message: 'No drivers available at the moment. Please try again later.',
        });
        
        return;
      }

      this.logger.log(
        `Found ${availableDrivers.length} available drivers for order ${orderId}`,
      );

      // Start Round Robin: Offer to first (nearest) driver
      await this.offerToNextDriver(orderId, availableDrivers, 0);
      
    } catch (error) {
      this.logger.error(`Error dispatching order ${orderId}:`, error);
    }
  }

  /**
   * ROUND ROBIN CORE: Offer order to the next available driver
   * 
   * @param orderId - Order ID
   * @param drivers - Array of available drivers sorted by distance
   * @param currentIndex - Current driver index in the array
   */
  private async offerToNextDriver(
    orderId: string,
    drivers: any[],
    currentIndex: number,
  ): Promise<void> {
    // Check if we've exhausted all drivers
    if (currentIndex >= drivers.length) {
      this.logger.error(
        `All drivers rejected/timed out for order ${orderId}. Dispatch failed.`,
      );
      
      const order = await this.ordersService.findById(orderId);
      
      // Notify customer that no driver accepted
      this.dispatcherGateway.notifyCustomer(order.customerId, 'order:no-driver-accepted', {
        orderId,
        message: 'Unfortunately, no driver is available to accept your order at this time.',
      });
      
      return;
    }

    // Check if we've exceeded max attempts
    const order = await this.ordersService.findById(orderId);
    if (order.dispatchAttempts >= this.maxDispatchAttempts) {
      this.logger.error(`Max dispatch attempts reached for order ${orderId}`);
      return;
    }

    // Get current driver
    const driver = drivers[currentIndex];
    const driverId = driver.userId;

    this.logger.log(
      `📢 Offering order ${orderId} to driver ${driverId} (${driver.distanceKm}km away) - Attempt ${currentIndex + 1}/${drivers.length}`,
    );

    // Record dispatch attempt
    await this.ordersService.recordDispatch(orderId, driverId, null);
    await this.ordersService.incrementDispatchAttempts(orderId);

    // Update order status to OFFERED
    await this.ordersService.updateStatus(orderId, OrderStatus.OFFERED);

    // Track that this driver has an active offer
    this.driverOffers.set(driverId, orderId);

    // Prepare order data for driver
    const orderData = {
      ...order,
      distanceToPickup: driver.distanceKm,
      estimatedTime: Math.round(driver.distanceKm * 2), // Rough estimate: 2 min per km
    };

    // Send offer to driver via WebSocket
    const offerSent = this.dispatcherGateway.offerOrderToDriver(driverId, orderData);

    if (!offerSent) {
      this.logger.warn(`Driver ${driverId} not connected, moving to next driver`);
      
      // Mark as no response and try next driver immediately
      await this.ordersService.recordDispatch(orderId, driverId, false);
      this.driverOffers.delete(driverId);
      
      return this.offerToNextDriver(orderId, drivers, currentIndex + 1);
    }

    // Set timeout for driver response
    const timeout = setTimeout(() => {
      this.handleDriverTimeout(orderId, driverId, drivers, currentIndex);
    }, this.driverResponseTimeout);

    // Store timeout reference
    this.pendingOffers.set(orderId, timeout);
  }

  /**
   * Handle driver accepting an order
   * 
   * @param orderId - Order ID
   * @param driverId - Driver ID who accepted
   */
  async handleDriverAccept(orderId: string, driverId: string): Promise<void> {
    this.logger.log(`✅ Driver ${driverId} accepted order ${orderId}`);

    // Clear timeout if exists
    const timeout = this.pendingOffers.get(orderId);
    if (timeout) {
      clearTimeout(timeout);
      this.pendingOffers.delete(orderId);
    }

    // Clear driver offer tracking
    this.driverOffers.delete(driverId);

    try {
      // Update dispatch history
      await this.ordersService.recordDispatch(orderId, driverId, true);

      // Assign driver to order
      await this.ordersService.assignDriver(orderId, driverId);

      // Get updated order
      const order = await this.ordersService.findById(orderId);

      // Notify customer
      this.dispatcherGateway.notifyCustomer(order.customerId, 'order:accepted', {
        orderId,
        driver: order.driver,
        message: 'A driver has accepted your order!',
      });

      this.logger.log(`🎉 Order ${orderId} successfully assigned to driver ${driverId}`);
      
    } catch (error) {
      this.logger.error(`Error assigning driver to order:`, error);
    }
  }

  /**
   * Handle driver rejecting an order
   * Move to next driver in Round Robin
   * 
   * @param orderId - Order ID
   * @param driverId - Driver ID who rejected
   * @param reason - Rejection reason (optional)
   */
  async handleDriverReject(
    orderId: string,
    driverId: string,
    reason?: string,
  ): Promise<void> {
    this.logger.log(`❌ Driver ${driverId} rejected order ${orderId}. Reason: ${reason || 'None'}`);

    // Clear timeout if exists
    const timeout = this.pendingOffers.get(orderId);
    if (timeout) {
      clearTimeout(timeout);
      this.pendingOffers.delete(orderId);
    }

    // Clear driver offer tracking
    this.driverOffers.delete(driverId);

    try {
      // Update dispatch history
      await this.ordersService.recordDispatch(orderId, driverId, false);

      // Get order and find next driver
      const order = await this.ordersService.findById(orderId);
      
      // Find available drivers again (to get fresh list)
      const availableDrivers = await this.providersService.findAvailableNear(
        order.pickupLat,
        order.pickupLng,
        50,
      );

      // Find index of current driver and move to next
      const currentIndex = availableDrivers.findIndex((d) => d.userId === driverId);
      
      if (currentIndex >= 0) {
        // Offer to next driver in line
        await this.offerToNextDriver(orderId, availableDrivers, currentIndex + 1);
      } else {
        // Driver not found, start from beginning
        await this.offerToNextDriver(orderId, availableDrivers, 0);
      }
      
    } catch (error) {
      this.logger.error(`Error handling driver rejection:`, error);
    }
  }

  /**
   * Handle driver timeout (no response within timeout period)
   * Automatically move to next driver in Round Robin
   * 
   * @param orderId - Order ID
   * @param driverId - Driver ID who timed out
   * @param drivers - Available drivers list
   * @param currentIndex - Current driver index
   */
  private async handleDriverTimeout(
    orderId: string,
    driverId: string,
    drivers: any[],
    currentIndex: number,
  ): Promise<void> {
    this.logger.warn(`⏱️ Driver ${driverId} timed out for order ${orderId}`);

    // Clear timeout tracking
    this.pendingOffers.delete(orderId);
    this.driverOffers.delete(driverId);

    try {
      // Record timeout as rejection
      await this.ordersService.recordDispatch(orderId, driverId, false);

      // Move to next driver
      await this.offerToNextDriver(orderId, drivers, currentIndex + 1);
      
    } catch (error) {
      this.logger.error(`Error handling driver timeout:`, error);
    }
  }

  /**
   * Cancel active dispatch for an order
   * 
   * @param orderId - Order ID
   */
  async cancelDispatch(orderId: string): Promise<void> {
    const timeout = this.pendingOffers.get(orderId);
    
    if (timeout) {
      clearTimeout(timeout);
      this.pendingOffers.delete(orderId);
      this.logger.log(`Cancelled dispatch for order ${orderId}`);
    }

    // Clear any driver offers for this order
    for (const [driverId, activeOrderId] of this.driverOffers.entries()) {
      if (activeOrderId === orderId) {
        this.driverOffers.delete(driverId);
      }
    }
  }

  /**
   * Get dispatcher statistics
   */
  getStats() {
    return {
      pendingOffers: this.pendingOffers.size,
      activeDriverOffers: this.driverOffers.size,
      timeout: this.driverResponseTimeout,
      maxAttempts: this.maxDispatchAttempts,
    };
  }
}
