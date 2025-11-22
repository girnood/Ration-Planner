import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { DispatcherService } from './dispatcher.service';
import { PricingModule } from '../pricing/pricing.module';
import { MapsModule } from '../maps/maps.module';
import { ProvidersModule } from '../providers/providers.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [PricingModule, MapsModule, ProvidersModule, WebsocketModule],
  providers: [OrdersService, DispatcherService],
  controllers: [OrdersController],
  exports: [OrdersService, DispatcherService],
})
export class OrdersModule {}
