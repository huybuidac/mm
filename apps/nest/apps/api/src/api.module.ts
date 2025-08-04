import { Module } from '@nestjs/common'

import { AuthModule } from '@app/auth/auth.module'
import { BotModule } from '@app/bot/bot.module'
import { CoreModule } from '@app/core/core.module'
import { TodoModule } from '@app/todo/todo.module'

@Module({
  imports: [CoreModule, AuthModule, BotModule, TodoModule],
  controllers: [],
  providers: [],
})
export class ApiModule {}
