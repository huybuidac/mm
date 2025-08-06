import { Expose, Type } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'
import { BotWalletEntity } from './bot-wallet.entity'
import { BotTokenEntity } from './bot-token.entity'

export class BotTokenWalletEntity {
  @ApiProperty()
  @Expose()
  walletAddress: string

  @ApiProperty()
  @Expose()
  tokenAddress: string

  @ApiProperty()
  @Expose()
  buyable: boolean

  @ApiProperty()
  @Expose()
  sellable: boolean

  @ApiProperty()
  @Expose()
  createdAt: Date

  @ApiProperty()
  @Expose()
  updatedAt: Date

  // Relations
  @ApiProperty({ type: () => BotWalletEntity })
  @Type(() => BotWalletEntity)
  @Expose()
  wallet: BotWalletEntity

  @ApiProperty({ type: () => BotTokenEntity })
  @Type(() => BotTokenEntity)
  @Expose()
  token: BotTokenEntity
}
