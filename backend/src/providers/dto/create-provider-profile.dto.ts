import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ProviderStatus } from '../../common/enums/provider-status.enum';

export class CreateProviderProfileDto {
  @IsUUID()
  userId: string;

  @IsString()
  vehicleType: 'FLATBED' | 'WHEELLIFT';

  @IsString()
  plateNumber: string;

  @IsEnum(ProviderStatus)
  status: ProviderStatus = ProviderStatus.PENDING;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsBoolean()
  isOnline: boolean;
}
