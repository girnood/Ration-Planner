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
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { DispatcherService } from './dispatcher.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

/**
 * Dispatcher Gateway - WebSocket gateway for real-time order dispatching and tracking
 * 
 * Events:
 * - order:offer - Server sends order offer to driver
 * - order:accept - Driver accepts order
 * - order:reject - Driver rejects order
 * - location:update - Driver updates location
 * - order:status - Order status updates
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
  private driverSockets: Map<string, Socket> = new Map(); // driverId -> Socket
  private customerSockets: Map<string, Socket> = new Map(); // customerId -> Socket

  constructor(
    @Inject(forwardRef(() => DispatcherService))
    private readonly dispatcherService: DispatcherService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Handle client connection
   */
  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    // Extract user info from handshake auth (JWT token)
    // In production, verify JWT token here
    const userId = client.handshake.auth?.userId;
    const userRole = client.handshake.auth?.role;

    if (!userId) {
      this.logger.warn(`Client ${client.id} connected without userId, disconnecting`);
      client.disconnect();
      return;
    }

    // Store socket based on role
    if (userRole === 'PROVIDER') {
      this.driverSockets.set(userId, client);
      this.logger.log(`Driver ${userId} connected`);
    } else if (userRole === 'CUSTOMER') {
      this.customerSockets.set(userId, client);
      this.logger.log(`Customer ${userId} connected`);
    }

    // Store userId in socket data for later use
    client.data.userId = userId;
    client.data.role = userRole;
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    const role = client.data.role;

    if (role === 'PROVIDER') {
      this.driverSockets.delete(userId);
      this.logger.log(`Driver ${userId} disconnected`);
    } else if (role === 'CUSTOMER') {
      this.customerSockets.delete(userId);
      this.logger.log(`Customer ${userId} disconnected`);
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Driver accepts order offer
   */
  @SubscribeMessage('order:accept')
  async handleOrderAccept(@ConnectedSocket() client: Socket, @MessageBody() data: { orderId: string }) {
    const driverId = client.data.userId;

    if (client.data.role !== 'PROVIDER') {
      client.emit('error', { message: 'Only providers can accept orders' });
      return;
    }

    this.logger.log(`Driver ${driverId} accepted order ${data.orderId}`);

    // Notify dispatcher service (this will resolve the promise in dispatcher service)
    const accepted = this.dispatcherService.handleDriverResponse(data.orderId, driverId, true);

    if (accepted) {
      // Update order
      const order = await this.prisma.order.update({
        where: { id: data.orderId },
        data: {
          driverId,
          status: OrderStatus.ACCEPTED,
        },
        include: {
          customer: true,
        },
      });

      // Notify customer
      const customerSocket = this.customerSockets.get(order.customerId);
      if (customerSocket) {
        customerSocket.emit('order:accepted', {
          orderId: data.orderId,
          driverId,
        });
      }

      // Confirm to driver
      client.emit('order:accepted', {
        orderId: data.orderId,
        message: 'Order accepted successfully',
      });
    } else {
      client.emit('error', { message: 'Order offer expired or already taken' });
    }
  }

  /**
   * Driver rejects order offer
   */
  @SubscribeMessage('order:reject')
  async handleOrderReject(@ConnectedSocket() client: Socket, @MessageBody() data: { orderId: string }) {
    const driverId = client.data.userId;

    if (client.data.role !== 'PROVIDER') {
      client.emit('error', { message: 'Only providers can reject orders' });
      return;
    }

    this.logger.log(`Driver ${driverId} rejected order ${data.orderId}`);

    // Notify dispatcher service
    this.dispatcherService.handleDriverResponse(data.orderId, driverId, false);

    // Dispatcher will automatically try next driver
  }

  /**
   * Driver updates location (for real-time tracking)
   */
  @SubscribeMessage('location:update')
  async handleLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { lat: number; lng: number },
  ) {
    const driverId = client.data.userId;

    if (client.data.role !== 'PROVIDER') {
      return;
    }

    // Update provider location in database
    await this.prisma.providerProfile.update({
      where: { userId: driverId },
      data: {
        currentLat: data.lat,
        currentLng: data.lng,
      },
    });

    // Broadcast location to customers who have active orders with this driver
    const activeOrders = await this.prisma.order.findMany({
      where: {
        driverId,
        status: {
          in: [OrderStatus.ACCEPTED, OrderStatus.ARRIVED, OrderStatus.IN_PROGRESS],
        },
      },
    });

    activeOrders.forEach((order) => {
      const customerSocket = this.customerSockets.get(order.customerId);
      if (customerSocket) {
        customerSocket.emit('driver:location', {
          orderId: order.id,
          lat: data.lat,
          lng: data.lng,
        });
      }
    });
  }

  /**
   * Send order offer to driver (called by dispatcher service)
   */
  async sendOrderOffer(orderId: string, driverId: string, orderData: any) {
    const driverSocket = this.driverSockets.get(driverId);

    if (!driverSocket) {
      this.logger.warn(`Driver ${driverId} is not connected, cannot send offer`);
      return false;
    }

    driverSocket.emit('order:offer', {
      orderId,
      ...orderData,
    });

    return true;
  }

  /**
   * Notify customer about order status update
   */
  async notifyCustomer(customerId: string, event: string, data: any) {
    const customerSocket = this.customerSockets.get(customerId);

    if (customerSocket) {
      customerSocket.emit(event, data);
    }
  }
}
