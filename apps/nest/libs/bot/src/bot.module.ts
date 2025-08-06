import { Module } from '@nestjs/common'
import { BotService } from './services/bot.service'
import { BotConfigController } from './controllers/bot-config.controller'
import { BotController } from './controllers/bot.controller'
import { BotConfigService } from './services/bot-config.service'
import { SwapCronService } from './services/swap-cron.service'

@Module({
  controllers: [BotConfigController, BotController],
  providers: [BotService, BotConfigService, SwapCronService],
  exports: [BotService, BotConfigService, SwapCronService],
})
export class BotModule {}
