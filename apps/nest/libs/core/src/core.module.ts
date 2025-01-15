import { ph } from '@app/helper/prisma.helper'
import KeyvRedis from '@keyv/redis'
import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { PrismaModule } from 'nestjs-prisma'

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        return {
          store: new KeyvRedis(process.env.REDIS_URL),
        }
      },
    }),
    PrismaModule.forRoot({
      isGlobal: true,
      prismaServiceOptions: {
        prismaOptions: {
          // log: ['query'],
        },
        middlewares: [
          ph.defaultPagingMiddleware(),
          // loggingMiddleware(),
        ],
      },
    }),
  ],
  providers: [],
  exports: [],
})
export class CoreModule {}
