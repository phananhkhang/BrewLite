import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRoleEnum } from './create-user.dto.js';

export class UpdateUserRolesDto {
  @ApiProperty({
    description: 'Vai trò mới của người dùng',
    enum: UserRoleEnum,
    example: UserRoleEnum.BARISTA,
  })
  @IsNotEmpty({ message: 'Vai trò không được để trống.' })
  @IsEnum(UserRoleEnum, { message: 'Vai trò phải thuộc: CUSTOMER, BARISTA, ADMIN' })
  role!: UserRoleEnum;
}
