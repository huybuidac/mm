import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtGuard } from '@app/auth/guards/jwt.guard'
import { BotConfigService } from '../services/bot-config.service'
import { CreateBotTokenDto } from '../dtos/create-bot-token.dto'
import { CreateBotTokenWalletsDto } from '../dtos/create-bot-token-wallets.dto'
import { BotTokenEntity } from '../entities/bot-token.entity'
import { BotTokenWalletEntity } from '../entities/bot-token-wallet.entity'

@Controller('bot-config')
@ApiTags('BotConfig')
export class BotConfigController {
  constructor(private readonly botConfigService: BotConfigService) {}

  @Get('tokens')
  @ApiOperation({ summary: 'Get all tokens' })
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: () => BotTokenEntity, isArray: true })
  @UseGuards(JwtGuard)
  getAllTokens() {
    return this.botConfigService.getAllTokens()
  }

  @Patch('tokens/:address/toggle-enabled')
  @ApiOperation({ summary: 'Toggle token enabled status' })
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: () => BotTokenEntity })
  @UseGuards(JwtGuard)
  toggleTokenEnabled(@Param('address') address: string) {
    return this.botConfigService.toggleTokenEnabled(address)
  }

  @Post('tokens')
  @ApiOperation({ summary: 'Create a new bot token' })
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: () => BotTokenEntity })
  @UseGuards(JwtGuard)
  createBotToken(@Body() createBotTokenDto: CreateBotTokenDto) {
    return this.botConfigService.createBotToken(createBotTokenDto)
  }

  @Post('token-wallets')
  @ApiOperation({ summary: 'Create bot token wallets configuration' })
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: () => BotTokenWalletEntity, isArray: true })
  @UseGuards(JwtGuard)
  createBotTokenWallets(@Body() createBotTokenWalletsDto: CreateBotTokenWalletsDto) {
    return this.botConfigService.createBotTokenWallets(createBotTokenWalletsDto)
  }

  @Get('tokens/:address/wallets')
  @ApiOperation({ summary: 'Get all token wallets' })
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: () => BotTokenWalletEntity, isArray: true })
  @UseGuards(JwtGuard)
  getAllTokenWallets(@Param('address') address: string) {
    return this.botConfigService.getAllTokenWallets(address)
  }
}
