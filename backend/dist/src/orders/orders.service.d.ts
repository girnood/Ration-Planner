import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class OrdersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createOrder(data: Prisma.OrderCreateInput): Promise<any>;
    updateStatus(orderId: string, status: OrderStatus): Promise<any>;
    assignDriver(orderId: string, driverId: string): Promise<any>;
    findSearchingOrders(): Promise<any>;
}
