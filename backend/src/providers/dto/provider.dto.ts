import { IsEnum, IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { VehicleType, ProviderStatus } from '@prisma/client';

export class CreateProviderProfileDto {
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @IsString()
  plateNumber: string;
}

export class UpdateProviderLocationDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}

export class UpdateProviderStatusDto {
  @IsEnum(ProviderStatus)
  status: ProviderStatus;
}
