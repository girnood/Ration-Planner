import { Module } from '@nestjs/common';
import { DispatcherService } from './dispatcher.service';
import { DispatcherGateway } from './dispatcher.gateway';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [ProvidersModule],
  providers: [DispatcherService, DispatcherGateway],
  exports: [DispatcherService],
})
export class DispatcherModule {}
