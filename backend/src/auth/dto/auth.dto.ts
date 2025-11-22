import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+968[0-9]{8}$/, {
    message: 'Phone number must be in format +968XXXXXXXX',
  })
  phone: string;
}

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+968[0-9]{8}$/, {
    message: 'Phone number must be in format +968XXXXXXXX',
  })
  phone: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{6}$/, {
    message: 'OTP must be 6 digits',
  })
  otp: string;
}
