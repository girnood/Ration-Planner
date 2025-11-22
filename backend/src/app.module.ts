import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProvidersModule } from './providers/providers.module';
import { OrdersModule } from './orders/orders.module';
import { PricingModule } from './pricing/pricing.module';
import { MapsModule } from './maps/maps.module';
import { DispatcherModule } from './dispatcher/dispatcher.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProvidersModule,
    OrdersModule,
    PricingModule,
    MapsModule,
    DispatcherModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
