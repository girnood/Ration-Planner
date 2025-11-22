import { Module } from '@nestjs/common';
import { DispatcherGateway } from './dispatcher.gateway';

@Module({
  providers: [DispatcherGateway],
  exports: [DispatcherGateway],
})
export class DispatcherModule {}
