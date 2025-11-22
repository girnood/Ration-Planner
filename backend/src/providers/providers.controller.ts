import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Param, 
  Body, 
  Query,
  UseGuards 
} from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, ProviderStatus } from '@prisma/client';

@Controller('providers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProvidersController {
  constructor(private providersService: ProvidersService) {}

  /**
   * Create provider profile for current user
   */
  @Post()
  @Roles(UserRole.PROVIDER)
  async create(@CurrentUser() user: any, @Body() data: any) {
    return this.providersService.create({
      userId: user.id,
      ...data,
    });
  }

  /**
   * Get current provider profile
   */
  @Get('me')
  @Roles(UserRole.PROVIDER)
  async getMyProfile(@CurrentUser() user: any) {
    return this.providersService.findByUserId(user.id);
  }

  /**
   * Update current provider location
   */
  @Patch('me/location')
  @Roles(UserRole.PROVIDER)
  async updateLocation(@CurrentUser() user: any, @Body() location: { lat: number; lng: number }) {
    return this.providersService.updateLocation(user.id, location);
  }

  /**
   * Set online/offline status
   */
  @Patch('me/status')
  @Roles(UserRole.PROVIDER)
  async setStatus(@CurrentUser() user: any, @Body() data: { isOnline: boolean }) {
    return this.providersService.setOnlineStatus(user.id, data.isOnline);
  }

  /**
   * Get my statistics
   */
  @Get('me/stats')
  @Roles(UserRole.PROVIDER)
  async getMyStats(@CurrentUser() user: any) {
    const provider = await this.providersService.findByUserId(user.id);
    return this.providersService.getStats(provider.id);
  }

  /**
   * Get all providers (admin only)
   */
  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('status') status?: ProviderStatus,
    @Query('isOnline') isOnline?: string,
  ) {
    return this.providersService.findAll(
      status,
      isOnline ? isOnline === 'true' : undefined,
    );
  }

  /**
   * Get provider by ID (admin only)
   */
  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string) {
    return this.providersService.findById(id);
  }

  /**
   * Approve provider (admin only)
   */
  @Patch(':id/approve')
  @Roles(UserRole.ADMIN)
  async approve(@Param('id') id: string) {
    return this.providersService.approve(id);
  }

  /**
   * Reject provider (admin only)
   */
  @Patch(':id/reject')
  @Roles(UserRole.ADMIN)
  async reject(@Param('id') id: string) {
    return this.providersService.reject(id);
  }

  /**
   * Suspend provider (admin only)
   */
  @Patch(':id/suspend')
  @Roles(UserRole.ADMIN)
  async suspend(@Param('id') id: string) {
    return this.providersService.suspend(id);
  }

  /**
   * Get provider statistics (admin only)
   */
  @Get(':id/stats')
  @Roles(UserRole.ADMIN)
  async getStats(@Param('id') id: string) {
    return this.providersService.getStats(id);
  }
}
