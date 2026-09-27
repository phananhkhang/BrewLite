import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Mật khẩu hiện tại của tài khoản',
    example: 'OldPassword@123',
  })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu cũ không được để trống.' })
  oldPassword!: string;

  @ApiProperty({
    description: 'Mật khẩu mới muốn thay đổi',
    example: 'NewPassword@456',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống.' })
  @MinLength(6, { message: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' })
  newPassword!: string;
}
