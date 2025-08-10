import { Body, Controller, Get, Param, Post, Query, Request, Sse, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags, ApiOkResponse } from '@nestjs/swagger'
import { JwtGuard } from '@app/auth/guards/jwt.guard'
import { BotService, CustomMessageEvent } from '../services/bot.service'
import { StartBotDto } from '../dtos/start-bot.dto'
import { CurUser } from '@app/core/decorators/user.decorator'
import { User } from '@prisma/client'
import { Observable } from 'rxjs'
import { TransformerExposeAll } from '@app/core/decorators/transformer-expose-all.decorator'
import { TokenSwapEntity } from '../entities/token-swap.entity'
import { QueryTokenSwapDto } from '../dtos/query-token-swap.dto'
import { RawQuery } from '@app/core/decorators/query.decorator'
import { CacheTTL } from '@nestjs/cache-manager'
import { AppCacheInterceptor } from '@app/core/interceptors/app-cache-interceptor'
import { UseInterceptors } from '@nestjs/common'

@Controller('bot')
@ApiTags('Bot')
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Sse('start/:tokenAddress')
  @ApiOperation({ summary: 'Start a bot trading job' })
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'Bot started successfully' })
  @UseGuards(JwtGuard)
  @TransformerExposeAll()
  startBot(
    @Param('tokenAddress') tokenAddress: string,
    @Query() startBotDto: any,
    @Request() req: Request,
  ): Observable<CustomMessageEvent> {
    return this.botService.startBot(tokenAddress, startBotDto)
  }

  @Sse('reconnect/:tokenAddress')
  @ApiOperation({ summary: 'Reconnect a bot trading job' })
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'Bot reconnected successfully' })
  @UseGuards(JwtGuard)
  @TransformerExposeAll()
  reconnectBot(@Param('tokenAddress') tokenAddress: string) {
    console.log('BotController.reconnectBot', tokenAddress)
    return this.botService.reconnectBot(tokenAddress)
  }

  @Post(':tokenAddress/stop')
  @ApiOperation({ summary: 'Stop a bot trading job' })
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'Bot stopped successfully' })
  @UseGuards(JwtGuard)
  stopBot(@Param('tokenAddress') tokenAddress: string, @CurUser() user: User) {
    return this.botService.stopTokenJob(tokenAddress)
  }

  @Get(':tokenAddress/swaps')
  @ApiOperation({ summary: 'Get all swaps for a token' })
  @ApiBearerAuth()
  @ApiOkResponse({ type: () => TokenSwapEntity, isArray: true })
  @UseGuards(JwtGuard)
  @CacheTTL(2000)
  @UseInterceptors(AppCacheInterceptor)
  getSwaps(@Param('tokenAddress') tokenAddress: string, @RawQuery() queryTokenSwapDto: QueryTokenSwapDto) {
    return this.botService.getSwaps(tokenAddress, queryTokenSwapDto)
  }
}
