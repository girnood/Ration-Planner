import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { CreateProviderProfileDto } from './dto/create-provider-profile.dto';

@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Post()
  createProfile(@Body() dto: CreateProviderProfileDto) {
    return this.providersService.createProfile(dto);
  }

  @Get(':userId')
  findByUser(@Param('userId') userId: string) {
    return this.providersService.findByUserId(userId);
  }
}
