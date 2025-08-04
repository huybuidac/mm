import { Module } from '@nestjs/common'
import { BotService } from './bot.service'
import { BotConfigController } from './controllers/bot-config.controller'
import { BotConfigService } from './services/bot-config.service'

@Module({
  controllers: [BotConfigController],
  providers: [BotService, BotConfigService],
  exports: [BotService, BotConfigService],
})
export class BotModule {}
