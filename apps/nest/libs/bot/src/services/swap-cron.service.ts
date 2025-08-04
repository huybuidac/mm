import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from 'nestjs-prisma'

@Injectable()
export class SwapCronService {
  constructor(private readonly prisma: PrismaService) {}

  // @Cron(CronExpression.EVERY_5_MINUTES)
  async handleSwap() {
    const tokens = await this.prisma.botToken.findMany()
  }
}
