import { Module } from '@nestjs/common';
import { PricingModule } from './pricing/pricing.module';
import { DispatcherModule } from './dispatcher/dispatcher.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    PricingModule,
    DispatcherModule,
    AuthModule,
    OrdersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
