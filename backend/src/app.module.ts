import { Module } from '@nestjs/common';
import { PricingModule } from './pricing/pricing.module';
import { DispatcherModule } from './dispatcher/dispatcher.module';

@Module({
  imports: [
    PricingModule,
    DispatcherModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
