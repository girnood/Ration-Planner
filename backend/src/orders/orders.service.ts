import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(data: Prisma.OrderCreateInput) {
    return this.prisma.order.create({
      data,
      include: {
        customer: true,
        driver: true,
      },
    });
  }

  async updateStatus(orderId: string, status: OrderStatus) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }

  async assignDriver(orderId: string, driverId: string) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        driver: {
          connect: { id: driverId },
        },
        status: OrderStatus.ACCEPTED,
      },
    });
  }

  async findSearchingOrders() {
    return this.prisma.order.findMany({
      where: { status: OrderStatus.SEARCHING },
      orderBy: { createdAt: 'asc' },
    });
  }
}
