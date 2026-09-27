import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Họ người dùng',
    example: 'Nguyễn',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Tên người dùng',
    example: 'Văn A',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Số điện thoại',
    example: '0901234567',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Ảnh đại diện URL',
    example: 'https://brewlite.vn/avatars/u1.jpg',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Mật khẩu mới (nếu muốn thay đổi)',
    example: 'NewSecret@2026',
    minLength: 6,
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới tối thiểu 6 ký tự.' })
  password?: string;

  @ApiPropertyOptional({
    description: 'Trạng thái kích hoạt tài khoản',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
