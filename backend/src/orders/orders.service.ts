import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { MapsService } from '../maps/maps.service';
import { OrderStatus } from '@prisma/client';

export interface CreateOrderDto {
  customerId: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  notes?: string;
}

/**
 * OrdersService
 * 
 * Manages order lifecycle:
 * 1. Create order with automatic pricing
 * 2. Calculate distance and price
 * 3. Initiate Round Robin dispatching
 * 4. Track order status
 */
@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private pricingService: PricingService,
    private mapsService: MapsService,
  ) {}

  /**
   * Create a new order
   * Automatically calculates distance and price
   */
  async create(data: CreateOrderDto) {
    // Calculate distance between pickup and dropoff
    const distanceResult = await this.mapsService.calculateDistance(
      { lat: data.pickupLat, lng: data.pickupLng },
      { lat: data.dropoffLat, lng: data.dropoffLng },
    );

    // Calculate price based on distance
    const price = this.pricingService.calculatePrice(distanceResult.distanceKm);

    // Generate unique order number
    const orderNumber = await this.generateOrderNumber();

    // Get addresses (if available)
    const pickupAddress = await this.mapsService.reverseGeocode({
      lat: data.pickupLat,
      lng: data.pickupLng,
    });

    const dropoffAddress = await this.mapsService.reverseGeocode({
      lat: data.dropoffLat,
      lng: data.dropoffLng,
    });

    // Create the order
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerId: data.customerId,
        pickupLat: data.pickupLat,
        pickupLng: data.pickupLng,
        pickupAddress,
        dropoffLat: data.dropoffLat,
        dropoffLng: data.dropoffLng,
        dropoffAddress,
        distanceKm: distanceResult.distanceKm,
        priceEstimated: price,
        baseFare: this.pricingService.getBaseFare(),
        ratePerKm: this.pricingService.getRatePerKm(),
        status: OrderStatus.SEARCHING,
        notes: data.notes,
      },
      include: {
        customer: true,
      },
    });

    return order;
  }

  /**
   * Generate unique order number (e.g., ORD-20240115-0001)
   */
  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const prefix = `ORD-${year}${month}${day}`;
    
    // Count orders created today
    const count = await this.prisma.order.count({
      where: {
        orderNumber: {
          startsWith: prefix,
        },
      },
    });

    const sequence = String(count + 1).padStart(4, '0');
    return `${prefix}-${sequence}`;
  }

  /**
   * Get order by ID
   */
  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            phone: true,
            name: true,
          },
        },
        driver: {
          select: {
            id: true,
            phone: true,
            name: true,
          },
        },
        dispatchHistory: {
          orderBy: {
            offeredAt: 'desc',
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  /**
   * Get orders for a customer
   */
  async findByCustomer(customerId: string, status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: {
        customerId,
        status: status || undefined,
      },
      include: {
        driver: {
          select: {
            id: true,
            phone: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get orders for a driver
   */
  async findByDriver(driverId: string, status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: {
        driverId,
        status: status || undefined,
      },
      include: {
        customer: {
          select: {
            id: true,
            phone: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get active order for a driver
   */
  async findActiveOrderForDriver(driverId: string) {
    return this.prisma.order.findFirst({
      where: {
        driverId,
        status: {
          in: [OrderStatus.ACCEPTED, OrderStatus.ARRIVED, OrderStatus.IN_PROGRESS],
        },
      },
      include: {
        customer: true,
      },
    });
  }

  /**
   * Assign driver to order
   */
  async assignDriver(orderId: string, driverId: string) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        driverId,
        status: OrderStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
    });
  }

  /**
   * Update order status
   */
  async updateStatus(orderId: string, status: OrderStatus) {
    const updateData: any = { status };

    // Set timestamps based on status
    if (status === OrderStatus.ACCEPTED) {
      updateData.acceptedAt = new Date();
    } else if (status === OrderStatus.ARRIVED) {
      updateData.arrivedAt = new Date();
    } else if (status === OrderStatus.IN_PROGRESS) {
      updateData.startedAt = new Date();
    } else if (status === OrderStatus.COMPLETED) {
      updateData.completedAt = new Date();
      // Set final price (could be adjusted for tolls, etc.)
      const order = await this.findById(orderId);
      updateData.priceFinal = order.priceEstimated;
    } else if (status === OrderStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });
  }

  /**
   * Cancel order
   */
  async cancel(orderId: string, reason?: string) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    });
  }

  /**
   * Record dispatch attempt
   */
  async recordDispatch(orderId: string, driverId: string, accepted: boolean | null = null) {
    return this.prisma.dispatchHistory.create({
      data: {
        orderId,
        driverId,
        accepted,
        respondedAt: accepted !== null ? new Date() : null,
      },
    });
  }

  /**
   * Increment dispatch attempts counter
   */
  async incrementDispatchAttempts(orderId: string) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        dispatchAttempts: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Get all orders (admin only)
   */
  async findAll(status?: OrderStatus, limit: number = 100) {
    return this.prisma.order.findMany({
      where: status ? { status } : undefined,
      include: {
        customer: {
          select: {
            id: true,
            phone: true,
            name: true,
          },
        },
        driver: {
          select: {
            id: true,
            phone: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }
}
