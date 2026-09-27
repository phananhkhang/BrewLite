import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Đã kết nối thành công tới cơ sở dữ liệu PostgreSQL qua Prisma.');
    } catch (error) {
      this.logger.error('Không thể kết nối tới cơ sở dữ liệu:', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Đã ngắt kết nối cơ sở dữ liệu an toàn.');
  }
}
