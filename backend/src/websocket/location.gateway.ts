import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

/**
 * LocationGateway
 * 
 * Dedicated WebSocket gateway for real-time location tracking.
 * Optimized for high-frequency location updates from drivers.
 */
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/location',
})
export class LocationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LocationGateway.name);
  
  // Store last known location for each driver
  private driverLocations: Map<string, { lat: number; lng: number; timestamp: Date }> = new Map();

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    this.logger.log(`Location tracker connected: ${userId}`);
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    this.logger.log(`Location tracker disconnected: ${userId}`);
  }

  /**
   * Handle real-time location updates from drivers
   * This runs at high frequency (e.g., every 5-10 seconds)
   */
  @SubscribeMessage('location:update')
  handleLocationUpdate(
    client: Socket,
    payload: { lat: number; lng: number; heading?: number; speed?: number },
  ) {
    const driverId = client.handshake.query.userId as string;
    
    if (!driverId) {
      return { error: 'User ID not provided' };
    }

    // Store the location
    this.driverLocations.set(driverId, {
      lat: payload.lat,
      lng: payload.lng,
      timestamp: new Date(),
    });

    // Broadcast to all clients tracking this driver
    // (e.g., customers with active orders from this driver)
    this.server.emit(`driver:${driverId}:location`, {
      lat: payload.lat,
      lng: payload.lng,
      heading: payload.heading,
      speed: payload.speed,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  /**
   * Get last known location for a driver
   */
  getDriverLocation(driverId: string) {
    return this.driverLocations.get(driverId);
  }

  /**
   * Get all active driver locations
   */
  getAllDriverLocations() {
    return Array.from(this.driverLocations.entries()).map(([driverId, location]) => ({
      driverId,
      ...location,
    }));
  }

  /**
   * Subscribe a customer to driver location updates
   */
  @SubscribeMessage('track:driver')
  handleTrackDriver(client: Socket, payload: { driverId: string }) {
    client.join(`tracking:${payload.driverId}`);
    
    // Send the last known location immediately
    const lastLocation = this.driverLocations.get(payload.driverId);
    if (lastLocation) {
      client.emit(`driver:${payload.driverId}:location`, lastLocation);
    }
    
    return { success: true };
  }

  /**
   * Unsubscribe from driver location updates
   */
  @SubscribeMessage('untrack:driver')
  handleUntrackDriver(client: Socket, payload: { driverId: string }) {
    client.leave(`tracking:${payload.driverId}`);
    return { success: true };
  }
}
