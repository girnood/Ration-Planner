import { OrdersService } from '../orders/orders.service';
import { ProvidersService } from '../providers/providers.service';
import { FareBreakdown, PricingService } from '../pricing/pricing.service';
import { LocationUpdateDto } from './dto/location-update.dto';
export declare class DispatcherService {
    private readonly ordersService;
    private readonly providersService;
    private readonly pricingService;
    private readonly logger;
    private readonly driverQueue;
    private queuePointer;
    constructor(ordersService: OrdersService, providersService: ProvidersService, pricingService: PricingService);
    handleDriverLocationUpdate(dto: LocationUpdateDto): Promise<void>;
    hydrateQueueFromPickup(pickup: {
        lat: number;
        lng: number;
    }): Promise<{
        userId: string;
        distanceM: number;
    }[]>;
    estimateFare(distanceKm: number): Promise<FareBreakdown>;
    dispatchOrder(orderId: string): Promise<null>;
    private syncQueue;
    private nextDriver;
    getQueueSnapshot(): string[];
}
