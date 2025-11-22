import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  /**
   * Get current user profile
   */
  @Get('me')
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.findById(user.id);
  }

  /**
   * Update current user profile
   */
  @Patch('me')
  async updateProfile(@CurrentUser() user: any, @Body() data: any) {
    return this.usersService.update(user.id, data);
  }

  /**
   * Get all users (admin only)
   */
  @Get()
  @Roles(UserRole.ADMIN)
  async findAll() {
    return this.usersService.findAll();
  }

  /**
   * Get user by ID (admin only)
   */
  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  /**
   * Deactivate user (admin only)
   */
  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN)
  async deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }

  /**
   * Activate user (admin only)
   */
  @Patch(':id/activate')
  @Roles(UserRole.ADMIN)
  async activate(@Param('id') id: string) {
    return this.usersService.activate(id);
  }
}
