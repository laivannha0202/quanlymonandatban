import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService) {
    const diaChi = new URL(config.getOrThrow<string>('DATABASE_URL'));

    const adapter = new PrismaMariaDb({
      host: diaChi.hostname,
      port: Number(diaChi.port || 3306),
      user: decodeURIComponent(diaChi.username),
      password: decodeURIComponent(diaChi.password),
      database: diaChi.pathname.replace(/^\//, ''),
      connectionLimit: 10,
      allowPublicKeyRetrieval: true,
    });

    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
