import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import { PricingService } from '../pricing/pricing.service';
import { DispatcherService } from '../dispatcher/dispatcher.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
    private readonly dispatcherService: DispatcherService,
  ) {}

  /**
   * Create a new order and trigger dispatcher
   */
  async create(customerId: string, data: CreateOrderDto) {
    // Calculate price
    const pricing = await this.pricingService.calculatePrice(
      data.pickupLat,
      data.pickupLng,
      data.dropoffLat,
      data.dropoffLng,
    );

    // Create order
    const order = await this.prisma.order.create({
      data: {
        customerId,
        pickupLat: data.pickupLat,
        pickupLng: data.pickupLng,
        dropoffLat: data.dropoffLat,
        dropoffLng: data.dropoffLng,
        distanceKm: pricing.distanceKm,
        priceEstimated: pricing.price,
        status: OrderStatus.SEARCHING,
      },
    });

    // Trigger dispatcher to find available driver (Round Robin)
    this.dispatcherService.dispatchOrder(order.id, data.pickupLat, data.pickupLng).catch((error) => {
      console.error('Error dispatching order:', error);
    });

    return order;
  }

  /**
   * Get all orders for a customer
   */
  async findByCustomer(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        driver: {
          select: {
            id: true,
            phone: true,
            providerProfile: {
              select: {
                vehicleType: true,
                plateNumber: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get all orders for a provider
   */
  async findByProvider(providerId: string) {
    return this.prisma.order.findMany({
      where: { driverId: providerId },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            phone: true,
          },
        },
      },
    });
  }

  /**
   * Get order by ID
   */
  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            phone: true,
          },
        },
        driver: {
          select: {
            id: true,
            phone: true,
            providerProfile: {
              select: {
                vehicleType: true,
                plateNumber: true,
              },
            },
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
   * Update order status
   */
  async updateStatus(id: string, data: UpdateOrderStatusDto) {
    const order = await this.findOne(id);

    // Validate status transition
    this.validateStatusTransition(order.status, data.status);

    const updateData: any = {
      status: data.status,
    };

    if (data.status === OrderStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    return this.prisma.order.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Accept order by provider
   */
  async acceptOrder(orderId: string, driverId: string) {
    const order = await this.findOne(orderId);

    if (order.status !== OrderStatus.SEARCHING) {
      throw new BadRequestException('Order is no longer available');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        driverId,
        status: OrderStatus.ACCEPTED,
      },
    });
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus) {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.SEARCHING]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
      [OrderStatus.ACCEPTED]: [OrderStatus.ARRIVED, OrderStatus.CANCELLED],
      [OrderStatus.ARRIVED]: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
      [OrderStatus.IN_PROGRESS]: [OrderStatus.COMPLETED],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }
}
