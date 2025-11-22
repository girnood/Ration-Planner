import { Module } from '@nestjs/common';
import { DispatcherGateway } from './dispatcher.gateway';
import { RoundRobinService } from './round-robin.service';

@Module({
  providers: [DispatcherGateway, RoundRobinService],
  exports: [RoundRobinService],
})
export class DispatcherModule {}
