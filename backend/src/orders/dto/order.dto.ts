import { IsNumber, IsEnum, Min, Max } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class CreateOrderDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  pickupLat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  pickupLng: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  dropoffLat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  dropoffLng: number;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
