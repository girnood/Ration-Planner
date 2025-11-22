import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PricingModule } from '../pricing/pricing.module';
import { ProvidersModule } from '../providers/providers.module';
import { DispatcherModule } from '../dispatcher/dispatcher.module';

@Module({
  imports: [PricingModule, ProvidersModule, DispatcherModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
