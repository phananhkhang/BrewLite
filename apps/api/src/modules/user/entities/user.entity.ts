import { Exclude } from 'class-transformer';

export class UserEntity {
  id!: string;
  email!: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  avatarUrl?: string | null;

  @Exclude()
  passwordHash?: string;

  status?: string;
  roles?: string[];
  createdAt?: Date;
  updatedAt?: Date;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
