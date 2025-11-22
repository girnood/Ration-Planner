import { Module } from '@nestjs/common';
import { DispatcherGateway } from './dispatcher.gateway';
import { LocationGateway } from './location.gateway';

@Module({
  providers: [DispatcherGateway, LocationGateway],
  exports: [DispatcherGateway, LocationGateway],
})
export class WebsocketModule {}
