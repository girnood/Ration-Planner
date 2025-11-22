import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Create a new order
   */
  @Post()
  create(@Request() req, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.user.id, dto);
  }

  /**
   * Get customer's orders
   */
  @Get('my-orders')
  getMyOrders(@Request() req) {
    return this.ordersService.findByCustomer(req.user.id);
  }

  /**
   * Get provider's orders
   */
  @Get('my-assignments')
  getMyAssignments(@Request() req) {
    return this.ordersService.findByProvider(req.user.id);
  }

  /**
   * Get order by ID
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  /**
   * Update order status
   */
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }

  /**
   * Accept order (Provider only)
   */
  @Post(':id/accept')
  acceptOrder(@Request() req, @Param('id') id: string) {
    return this.ordersService.acceptOrder(id, req.user.id);
  }
}
