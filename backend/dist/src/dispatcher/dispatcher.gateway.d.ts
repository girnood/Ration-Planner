import { Server, Socket } from 'socket.io';
import { DispatcherService } from './dispatcher.service';
import { LocationUpdateDto } from './dto/location-update.dto';
export declare class DispatcherGateway {
    private readonly dispatcherService;
    private readonly logger;
    server: Server;
    constructor(dispatcherService: DispatcherService);
    handleConnection(socket: Socket): void;
    handleDisconnect(socket: Socket): void;
    handleDriverLocationUpdate(payload: LocationUpdateDto): Promise<{
        ok: boolean;
    }>;
    handleDispatchOrder(body: {
        orderId: string;
    }): Promise<void>;
}
