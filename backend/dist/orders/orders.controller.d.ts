import { OrdersService } from './orders.service';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    createOrder(body: {
        customerId: string;
        pickupLat: number;
        pickupLng: number;
        dropoffLat: number;
        dropoffLng: number;
    }): Promise<{
        driverId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        pickup_lat: number;
        pickup_lng: number;
        dropoff_lat: number;
        dropoff_lng: number;
        price_estimated: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.OrderStatus;
        customerId: string;
    }>;
}
