import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  Logger,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { DispatcherService } from './dispatcher.service';
import { LocationUpdateDto } from './dto/location-update.dto';

@WebSocketGateway({
  namespace: 'dispatcher',
  cors: {
    origin: '*',
  },
})
export class DispatcherGateway {
  private readonly logger = new Logger(DispatcherGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly dispatcherService: DispatcherService) {}

  handleConnection(socket: Socket) {
    this.logger.verbose(`Client connected to dispatcher: ${socket.id}`);
  }

  handleDisconnect(socket: Socket) {
    this.logger.verbose(`Client disconnected from dispatcher: ${socket.id}`);
  }

  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @SubscribeMessage('driverLocationUpdate')
  async handleDriverLocationUpdate(@MessageBody() payload: LocationUpdateDto) {
    await this.dispatcherService.handleDriverLocationUpdate(payload);

    this.server.emit('driverLocationUpdated', {
      driverId: payload.driverId,
      lat: payload.lat,
      lng: payload.lng,
      isOnline: payload.isOnline ?? undefined,
    });

    return { ok: true };
  }

  @SubscribeMessage('dispatchOrder')
  async handleDispatchOrder(@MessageBody() body: { orderId: string }) {
    await this.dispatcherService.dispatchOrder(body.orderId);
  }
}
