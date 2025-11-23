import { PricingService } from '../pricing/pricing.service';
import { DispatcherGateway } from '../dispatcher/dispatcher.gateway';
export declare class OrdersService {
    private pricingService;
    private dispatcherGateway;
    private prisma;
    constructor(pricingService: PricingService, dispatcherGateway: DispatcherGateway);
    createOrder(data: {
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
    private calculateDistance;
    private deg2rad;
}
