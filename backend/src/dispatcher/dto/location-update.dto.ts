import { IsNumber, IsString, IsUUID } from 'class-validator';

export class LocationUpdateDto {
  @IsUUID()
  driverId: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsNumber()
  heading: number;

  @IsString()
  status: string;
}
