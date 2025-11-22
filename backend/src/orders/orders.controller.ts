import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService, CreateOrderDto } from './orders.service';
import { DispatcherService } from './dispatcher.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, OrderStatus } from '@prisma/client';

/**
 * OrdersController
 * 
 * Handles all order-related endpoints:
 * - Create order (customer)
 * - View orders (customer/driver/admin)
 * - Update order status (driver)
 * - Accept/reject orders (driver)
 */
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(
    private ordersService: OrdersService,
    private dispatcherService: DispatcherService,
  ) {}

  /**
   * Create a new order (Customer only)
   * Automatically starts the Round Robin dispatching process
   */
  @Post()
  @Roles(UserRole.CUSTOMER)
  async create(@CurrentUser() user: any, @Body() data: Omit<CreateOrderDto, 'customerId'>) {
    // Create the order
    const order = await this.ordersService.create({
      ...data,
      customerId: user.id,
    });

    // Start dispatching to available drivers
    // Run asynchronously to not block the response
    this.dispatcherService.startDispatching(order.id).catch((error) => {
      console.error(`Error starting dispatch for order ${order.id}:`, error);
    });

    return {
      ...order,
      message: 'Order created successfully. Searching for nearby drivers...',
    };
  }

  /**
   * Get customer's orders
   */
  @Get('my-orders')
  @Roles(UserRole.CUSTOMER)
  async getMyOrders(@CurrentUser() user: any, @Query('status') status?: OrderStatus) {
    return this.ordersService.findByCustomer(user.id, status);
  }

  /**
   * Get driver's orders
   */
  @Get('my-deliveries')
  @Roles(UserRole.PROVIDER)
  async getMyDeliveries(@CurrentUser() user: any, @Query('status') status?: OrderStatus) {
    return this.ordersService.findByDriver(user.id, status);
  }

  /**
   * Get driver's active order
   */
  @Get('my-active-order')
  @Roles(UserRole.PROVIDER)
  async getMyActiveOrder(@CurrentUser() user: any) {
    const order = await this.ordersService.findActiveOrderForDriver(user.id);
    
    if (!order) {
      return { message: 'No active order' };
    }

    return order;
  }

  /**
   * Accept an order (Driver only)
   */
  @Post(':id/accept')
  @Roles(UserRole.PROVIDER)
  async acceptOrder(@CurrentUser() user: any, @Param('id') orderId: string) {
    // Handle through dispatcher service
    await this.dispatcherService.handleDriverAccept(orderId, user.id);
    
    return {
      message: 'Order accepted successfully',
      order: await this.ordersService.findById(orderId),
    };
  }

  /**
   * Reject an order (Driver only)
   */
  @Post(':id/reject')
  @Roles(UserRole.PROVIDER)
  async rejectOrder(
    @CurrentUser() user: any,
    @Param('id') orderId: string,
    @Body() data: { reason?: string },
  ) {
    // Handle through dispatcher service
    await this.dispatcherService.handleDriverReject(orderId, user.id, data.reason);
    
    return {
      message: 'Order rejected',
    };
  }

  /**
   * Update order status (Driver only)
   * Used for: ARRIVED, IN_PROGRESS, COMPLETED
   */
  @Patch(':id/status')
  @Roles(UserRole.PROVIDER)
  async updateStatus(
    @CurrentUser() user: any,
    @Param('id') orderId: string,
    @Body() data: { status: OrderStatus },
  ) {
    const order = await this.ordersService.findById(orderId);

    // Verify driver is assigned to this order
    if (order.driverId !== user.id) {
      return {
        error: 'You are not assigned to this order',
      };
    }

    // Update status
    await this.ordersService.updateStatus(orderId, data.status);

    return {
      message: `Order status updated to ${data.status}`,
      order: await this.ordersService.findById(orderId),
    };
  }

  /**
   * Cancel order (Customer only, only before driver accepts)
   */
  @Post(':id/cancel')
  @Roles(UserRole.CUSTOMER)
  async cancelOrder(
    @CurrentUser() user: any,
    @Param('id') orderId: string,
    @Body() data: { reason?: string },
  ) {
    const order = await this.ordersService.findById(orderId);

    // Verify customer owns this order
    if (order.customerId !== user.id) {
      return {
        error: 'You do not have permission to cancel this order',
      };
    }

    // Only allow cancellation if order is still searching or offered
    if (![OrderStatus.SEARCHING, OrderStatus.OFFERED].includes(order.status)) {
      return {
        error: 'Order cannot be cancelled at this stage',
      };
    }

    // Cancel dispatch
    await this.dispatcherService.cancelDispatch(orderId);

    // Cancel order
    await this.ordersService.cancel(orderId, data.reason);

    return {
      message: 'Order cancelled successfully',
    };
  }

  /**
   * Get order details
   */
  @Get(':id')
  async getOrder(@CurrentUser() user: any, @Param('id') orderId: string) {
    const order = await this.ordersService.findById(orderId);

    // Check permissions
    if (
      order.customerId !== user.id &&
      order.driverId !== user.id &&
      user.role !== UserRole.ADMIN
    ) {
      return {
        error: 'You do not have permission to view this order',
      };
    }

    return order;
  }

  /**
   * Get all orders (Admin only)
   */
  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('status') status?: OrderStatus,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit) : 100;
    return this.ordersService.findAll(status, limitNum);
  }

  /**
   * Get dispatcher statistics (Admin only)
   */
  @Get('admin/dispatcher-stats')
  @Roles(UserRole.ADMIN)
  async getDispatcherStats() {
    return this.dispatcherService.getStats();
  }
}
