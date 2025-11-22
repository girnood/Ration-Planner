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
 * DispatcherGateway
 * 
 * WebSocket gateway for real-time order dispatching and tracking.
 * 
 * Features:
 * - Driver location updates
 * - Order status updates
 * - Real-time customer tracking
 * - Driver-customer chat (future)
 * 
 * Events:
 * - 'order:created' - New order created
 * - 'order:offered' - Order offered to driver
 * - 'order:accepted' - Driver accepted order
 * - 'order:updated' - Order status changed
 * - 'driver:location' - Driver location update
 */
@WebSocketGateway({
  cors: {
    origin: '*', // Configure properly in production
    credentials: true,
  },
  namespace: '/dispatcher',
})
export class DispatcherGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DispatcherGateway.name);
  
  // Track connected clients by user ID
  private connectedClients: Map<string, Socket> = new Map();
  
  // Track which driver is currently handling which order
  private activeOrders: Map<string, string> = new Map(); // orderId -> driverId

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    
    if (userId) {
      this.connectedClients.set(userId, client);
      this.logger.log(`Client connected: ${userId} (${client.id})`);
    } else {
      this.logger.warn(`Client connected without userId: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    
    if (userId) {
      this.connectedClients.delete(userId);
      this.logger.log(`Client disconnected: ${userId} (${client.id})`);
    }
  }

  /**
   * Emit order offer to a specific driver
   * This is called by the Round Robin dispatcher
   * 
   * @param driverId - ID of the driver to offer the order to
   * @param orderData - Order information
   */
  offerOrderToDriver(driverId: string, orderData: any) {
    const driverSocket = this.connectedClients.get(driverId);
    
    if (driverSocket) {
      driverSocket.emit('order:offered', orderData);
      this.logger.log(`Order ${orderData.id} offered to driver ${driverId}`);
      return true;
    } else {
      this.logger.warn(`Driver ${driverId} not connected, cannot offer order`);
      return false;
    }
  }

  /**
   * Notify customer about order status changes
   * 
   * @param customerId - ID of the customer
   * @param event - Event name
   * @param data - Event data
   */
  notifyCustomer(customerId: string, event: string, data: any) {
    const customerSocket = this.connectedClients.get(customerId);
    
    if (customerSocket) {
      customerSocket.emit(event, data);
      this.logger.log(`Notified customer ${customerId}: ${event}`);
    }
  }

  /**
   * Broadcast order status update to all relevant parties
   * 
   * @param orderId - Order ID
   * @param customerId - Customer ID
   * @param driverId - Driver ID (optional)
   * @param status - New order status
   * @param data - Additional data
   */
  broadcastOrderUpdate(
    orderId: string,
    customerId: string,
    driverId: string | null,
    status: string,
    data: any,
  ) {
    const updateData = {
      orderId,
      status,
      ...data,
    };

    // Notify customer
    this.notifyCustomer(customerId, 'order:updated', updateData);

    // Notify driver if assigned
    if (driverId) {
      const driverSocket = this.connectedClients.get(driverId);
      if (driverSocket) {
        driverSocket.emit('order:updated', updateData);
        this.logger.log(`Notified driver ${driverId} about order ${orderId}`);
      }
    }

    this.logger.log(`Broadcast order update: ${orderId} - ${status}`);
  }

  /**
   * Handle driver location updates
   * Broadcast to customer if driver is on an active order
   */
  @SubscribeMessage('driver:location')
  handleDriverLocation(client: Socket, payload: any) {
    const driverId = client.handshake.query.userId as string;
    const { orderId, lat, lng } = payload;

    if (orderId && this.activeOrders.get(orderId) === driverId) {
      // Find the customer for this order and send location update
      // This will be implemented when we integrate with the orders service
      this.server.emit(`order:${orderId}:driver-location`, {
        lat,
        lng,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle driver accepting an order
   */
  @SubscribeMessage('order:accept')
  handleOrderAccept(client: Socket, payload: { orderId: string }) {
    const driverId = client.handshake.query.userId as string;
    
    this.activeOrders.set(payload.orderId, driverId);
    
    // This will trigger the orders service to update the order
    this.server.emit('order:accepted:internal', {
      orderId: payload.orderId,
      driverId,
    });
    
    this.logger.log(`Driver ${driverId} accepted order ${payload.orderId}`);
  }

  /**
   * Handle driver rejecting an order
   */
  @SubscribeMessage('order:reject')
  handleOrderReject(client: Socket, payload: { orderId: string; reason?: string }) {
    const driverId = client.handshake.query.userId as string;
    
    // This will trigger the orders service to offer to next driver
    this.server.emit('order:rejected:internal', {
      orderId: payload.orderId,
      driverId,
      reason: payload.reason,
    });
    
    this.logger.log(`Driver ${driverId} rejected order ${payload.orderId}`);
  }

  /**
   * Check if a user is currently connected
   */
  isUserConnected(userId: string): boolean {
    return this.connectedClients.has(userId);
  }

  /**
   * Get count of connected clients
   */
  getConnectedCount(): number {
    return this.connectedClients.size;
  }
}
