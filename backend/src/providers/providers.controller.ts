import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProviderProfileDto, UpdateProviderLocationDto, UpdateProviderStatusDto } from './dto/provider.dto';

@Controller('providers')
@UseGuards(JwtAuthGuard)
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  /**
   * Create provider profile
   */
  @Post('profile')
  createProfile(@Request() req, @Body() dto: CreateProviderProfileDto) {
    return this.providersService.createProfile(req.user.id, dto);
  }

  /**
   * Get own provider profile
   */
  @Get('profile')
  getProfile(@Request() req) {
    return this.providersService.getProfile(req.user.id);
  }

  /**
   * Update provider location (for real-time tracking)
   */
  @Patch('location')
  updateLocation(@Request() req, @Body() dto: UpdateProviderLocationDto) {
    return this.providersService.updateLocation(req.user.id, dto);
  }

  /**
   * Update online status
   */
  @Patch('online-status')
  updateOnlineStatus(@Request() req, @Body() dto: { isOnline: boolean }) {
    return this.providersService.updateOnlineStatus(req.user.id, dto.isOnline);
  }

  /**
   * Update provider status (Admin only - TODO: Add admin guard)
   */
  @Patch(':userId/status')
  updateStatus(@Param('userId') userId: string, @Body() dto: UpdateProviderStatusDto) {
    return this.providersService.updateStatus(userId, dto);
  }
}
