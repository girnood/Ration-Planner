import { Module } from '@nestjs/common';
import { DispatcherGateway } from './dispatcher.gateway';
import { DispatcherService } from './dispatcher.service';
import { ProvidersModule } from '../providers/providers.module';
import { OrdersModule } from '../orders/orders.module';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [ProvidersModule, OrdersModule, PricingModule],
  providers: [DispatcherService, DispatcherGateway],
  exports: [DispatcherService],
})
export class DispatcherModule {}
