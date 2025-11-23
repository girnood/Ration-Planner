import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class DispatcherGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private activeDrivers;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleLocationUpdate(data: {
        driverId: string;
        lat: number;
        lng: number;
    }, client: Socket): void;
    handleTowRequest(data: {
        customerId: string;
        lat: number;
        lng: number;
    }): void;
    dispatchJob(request: {
        customerId: string;
        lat: number;
        lng: number;
    }): Promise<void>;
}
