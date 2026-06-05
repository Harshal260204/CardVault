import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import type { HealthStatus } from '../contracts/types';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get()
  async check(): Promise<{ data: HealthStatus }> {
    let database: HealthStatus['services']['database'] = 'unknown';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'up';
    } catch {
      database = 'down';
    }

    const redis = this.redis.enabled ? await this.redis.ping() : 'unknown';

    const payload: HealthStatus = {
      status: database === 'up' ? 'ok' : 'degraded',
      version: process.env.npm_package_version ?? '0.1.0',
      timestamp: new Date().toISOString(),
      services: {
        database,
        redis,
      },
    };

    return { data: payload };
  }
}
