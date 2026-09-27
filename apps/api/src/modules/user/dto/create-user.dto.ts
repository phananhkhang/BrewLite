import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export enum UserRoleEnum {
  CUSTOMER = 'CUSTOMER',
  BARISTA = 'BARISTA',
  ADMIN = 'ADMIN',
}

export class CreateUserDto {
  @ApiProperty({
    description: 'Địa chỉ email người dùng',
    example: 'staff@brewlite.vn',
  })
  @IsEmail({}, { message: 'Định dạng email không hợp lệ.' })
  @IsNotEmpty({ message: 'Email không được để trống.' })
  email!: string;

  @ApiProperty({
    description: 'Mật khẩu khởi tạo',
    example: 'Staff@2026',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống.' })
  @MinLength(6, { message: 'Mật khẩu phải từ 6 ký tự.' })
  password!: string;

  @ApiPropertyOptional({
    description: 'Tên',
    example: 'Văn A',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Họ',
    example: 'Nguyễn',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Số điện thoại',
    example: '0901234567',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Vai trò người dùng trong hệ thống',
    example: 'BARISTA',
    default: 'CUSTOMER',
  })
  @IsOptional()
  @IsString()
  role?: string;
}
