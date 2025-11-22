import { IsEnum, IsPhoneNumber, IsString } from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum';

export class CreateUserDto {
  @IsPhoneNumber('OM', {
    message: 'Phone number must be a valid Oman MSISDN',
  })
  phone: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  locale: 'en' | 'ar';
}
