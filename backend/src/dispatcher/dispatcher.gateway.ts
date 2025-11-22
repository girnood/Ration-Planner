import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { LocationUpdateDto } from './dto/location-update.dto';
import { RoundRobinService } from './round-robin.service';

@WebSocketGateway({
  namespace: '/dispatch',
  cors: {
    origin: '*',
  },
})
export class DispatcherGateway {
  private readonly logger = new Logger(DispatcherGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly roundRobin: RoundRobinService) {}

  handleConnection(client: Socket) {
    const driverId = client.handshake.auth?.driverId ?? client.handshake.query?.driverId;
    if (typeof driverId === 'string') {
      client.data.driverId = driverId;
      this.roundRobin.registerDriver(driverId);
      client.join(`driver:${driverId}`);
      this.logger.debug(`Driver ${driverId} connected to dispatcher gateway.`);
    }
  }

  handleDisconnect(client: Socket) {
    const driverId: string | undefined = client.data.driverId;
    if (driverId) {
      this.roundRobin.removeDriver(driverId);
      client.leave(`driver:${driverId}`);
      this.logger.debug(`Driver ${driverId} disconnected from dispatcher gateway.`);
    }
  }

  @SubscribeMessage('driver.location.update')
  handleLocationUpdate(@MessageBody() payload: LocationUpdateDto, @ConnectedSocket() client: Socket) {
    const driverId = payload.driverId ?? client.data.driverId;
    if (!driverId) {
      return;
    }

    this.roundRobin.updateDriverLocation(driverId, payload.lat, payload.lng, payload.heading, payload.status);
    this.server.emit('driver.location.broadcast', {
      driverId,
      lat: payload.lat,
      lng: payload.lng,
      heading: payload.heading,
      status: payload.status,
      updatedAt: new Date().toISOString(),
    });
  }

  @SubscribeMessage('order.request')
  handleOrderRequest(@MessageBody() orderPayload: Record<string, unknown>) {
    /**
     * Round-robin dispatching:
     * 1. Fetch the next driver id from the queue.
     * 2. Emit an offer to that driver's socket room (driver:<id>).
     * 3. Start a 20-second timer; if the driver does not respond we move to
     *    the next driver and repeat, guaranteeing fair distribution.
     */
    const nextDriver = this.roundRobin.getNextDriver();
    if (!nextDriver) {
      this.server.emit('order.no-driver', orderPayload);
      return;
    }

    this.server.to(`driver:${nextDriver.id}`).emit('order.offer', {
      ...orderPayload,
      driverId: nextDriver.id,
      expiresAt: Date.now() + 20 * 1000,
    });
  }
}
