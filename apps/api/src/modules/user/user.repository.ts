import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { QueryUserDto } from './dto/query-user.dto.js';
import { UserEntity } from './entities/user.entity.js';

export interface CreateUserData {
  username: string;
  passwordHash: string;
  role?: 'CUSTOMER' | 'BARISTA' | 'ADMIN';
}

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user ? new UserEntity(user) : null;
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });
    return user ? new UserEntity(user) : null;
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: {
        username: data.username,
        passwordHash: data.passwordHash,
        role: data.role ?? 'CUSTOMER',
      },
    });
    return new UserEntity(user);
  }

  async update(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.passwordHash ? { passwordHash: data.passwordHash } : {}),
        ...(data.role ? { role: data.role as 'CUSTOMER' | 'BARISTA' | 'ADMIN' } : {}),
        ...(typeof data.isActive === 'boolean' ? { isActive: data.isActive } : {}),
        ...(typeof data.loyaltyBalance === 'number' ? { loyaltyBalance: data.loyaltyBalance } : {}),
      },
    });
    return new UserEntity(user);
  }

  async findMany(query: QueryUserDto): Promise<{ users: UserEntity[]; total: number }> {
    const { page = 1, limit = 10, search, role } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.username = { contains: search, mode: 'insensitive' };
    }

    if (role) {
      where.role = role;
    }

    const [total, records] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      users: records.map((r) => new UserEntity(r)),
      total,
    };
  }
}
