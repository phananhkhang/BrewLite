import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Mã token xác thực một lần để đặt lại mật khẩu',
    example: 'd9b2e8c4-5412-4fc9-b690-9f2cb4290740',
  })
  @IsString()
  @IsNotEmpty({ message: 'Token đặt lại mật khẩu không được để trống.' })
  token!: string;

  @ApiProperty({
    description: 'Mật khẩu mới',
    example: 'NewPassword@123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống.' })
  @MinLength(6, { message: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' })
  newPassword!: string;
}
