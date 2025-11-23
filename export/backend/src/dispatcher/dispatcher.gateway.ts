import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class DispatcherGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeDrivers: Map<string, { socketId: string; lat: number; lng: number }> = new Map();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    for (const [driverId, data] of this.activeDrivers.entries()) {
      if (data.socketId === client.id) {
        this.activeDrivers.delete(driverId);
        break;
      }
    }
  }

  @SubscribeMessage('updateLocation')
  handleLocationUpdate(
    @MessageBody() data: { driverId: string; lat: number; lng: number },
    @ConnectedSocket() client: Socket,
  ): void {
    this.activeDrivers.set(data.driverId, {
      socketId: client.id,
      lat: data.lat,
      lng: data.lng,
    });
  }

  @SubscribeMessage('requestTow')
  handleTowRequest(@MessageBody() data: { customerId: string; lat: number; lng: number }): void {
    console.log('Tow requested', data);
    this.dispatchJob(data);
  }

  public async dispatchJob(request: { customerId: string; lat: number; lng: number }) {
    console.log(`Dispatching job for customer ${request.customerId} at ${request.lat}, ${request.lng}`);
    
    // MVP MOCK: Simulate finding a driver after 3 seconds
    setTimeout(() => {
        const mockDriverId = "driver-abc-123";
        console.log(`Driver found: ${mockDriverId}. Notifying customer...`);
        
        // Broadcast to everyone for MVP simplicity (in real app, use rooms)
        this.server.emit('driverFound', {
            customerId: request.customerId,
            driverId: mockDriverId,
            driverName: "Ahmed Al-Balushi",
            etaMinutes: 15,
            vehiclePlate: "9876 AB"
        });
    }, 3000);
  }
}
