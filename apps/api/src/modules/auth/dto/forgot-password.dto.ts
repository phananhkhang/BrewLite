import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Tên đăng nhập hoặc Email tài khoản cần khôi phục mật khẩu',
    example: 'customer01',
  })
  @IsString()
  @IsNotEmpty({ message: 'Tên đăng nhập/Email không được để trống.' })
  username!: string;
}
