import { Injectable } from '@nestjs/common';
import { OrderStatus } from '../common/enums/order-status.enum';
import { PricingService } from '../pricing/pricing.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
  ) {}

  async create(dto: CreateOrderDto) {
    const price = this.pricing.calculate(dto.estimatedDistanceKm);

    return this.prisma.order.create({
      data: {
        customerId: dto.customerId,
        driverId: dto.driverId ?? null,
        pickupLat: dto.pickupLat,
        pickupLng: dto.pickupLng,
        dropoffLat: dto.dropoffLat,
        dropoffLng: dto.dropoffLng,
        priceEstimated: price,
        status: OrderStatus.SEARCHING,
      },
    });
  }

  findById(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
    });
  }

  updateStatus(id: string, status: OrderStatus) {
    return this.prisma.order.update({
      where: { id },
      data: { status },
    });
  }
}
