import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PricingModule } from '../pricing/pricing.module';
import { DispatcherModule } from '../dispatcher/dispatcher.module';

@Module({
  imports: [PricingModule, DispatcherModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
