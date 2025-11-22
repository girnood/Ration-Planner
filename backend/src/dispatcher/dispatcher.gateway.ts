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

  // Map to store active drivers and their sockets/locations
  // In a real app, use Redis for scalability
  private activeDrivers: Map<string, { socketId: string; lat: number; lng: number }> = new Map();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Clean up driver if they disconnect
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
    // Broadcast location to relevant rooms (e.g., admin, or specific customer tracking this driver)
    // this.server.to(`tracking_${data.driverId}`).emit('driverLocation', data);
  }

  @SubscribeMessage('requestTow')
  handleTowRequest(@MessageBody() data: { customerId: string; lat: number; lng: number }): void {
    console.log('Tow requested', data);
    this.dispatchJob(data);
  }

  /**
   * Round Robin Dispatching Logic
   * ---------------------------
   * 1. Find all available (online) drivers within a certain radius (e.g., 50km).
   * 2. Sort them by distance (nearest first) or by wait time (longest idle first) - "Round Robin" usually implies rotating through a list or nearest available.
   *    Here, we'll interpret "Round Robin" + "Find nearest driver" as:
   *    - Get list of nearest drivers.
   *    - Offer job to Driver A (Nearest).
   *    - Wait 20 seconds for acceptance.
   *    - If no response/reject, offer to Driver B (Next Nearest).
   *    - Repeat until accepted or no drivers left.
   */
  private async dispatchJob(request: { customerId: string; lat: number; lng: number }) {
    // 1. Query PostGIS/Redis for nearest drivers (Mocking list here)
    // const drivers = await this.findNearestDrivers(request.lat, request.lng);

    // 2. Iterate and offer
    // for (const driver of drivers) {
    //   const accepted = await this.offerJobToDriver(driver, request);
    //   if (accepted) return;
    // }
    
    // 3. If no one accepts, notify customer
    this.server.emit('noDriversFound', { customerId: request.customerId });
  }
}
