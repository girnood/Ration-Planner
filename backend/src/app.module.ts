import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DispatcherModule } from './dispatcher/dispatcher.module';
import { OrdersModule } from './orders/orders.module';
import { PricingModule } from './pricing/pricing.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProvidersModule } from './providers/providers.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    ProvidersModule,
    OrdersModule,
    PricingModule,
    DispatcherModule,
  ],
})
export class AppModule {}
