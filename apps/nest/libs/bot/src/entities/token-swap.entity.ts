import { Expose } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'

export class TokenSwapEntity {
  @ApiProperty()
  @Expose()
  txHash: string

  @ApiProperty()
  @Expose()
  index: number

  @ApiProperty()
  @Expose()
  jobId?: string

  @ApiProperty()
  @Expose()
  isBuy: boolean

  @ApiProperty()
  @Expose()
  tokenAddress: string

  @ApiProperty()
  @Expose()
  blockNumber: number

  @ApiProperty()
  @Expose()
  tokenAmount: string

  @ApiProperty()
  @Expose()
  ethAmount: string

  @ApiProperty()
  @Expose()
  sender: string

  @ApiProperty()
  @Expose()
  recipient: string

  @ApiProperty()
  @Expose()
  amount0: string

  @ApiProperty()
  @Expose()
  amount1: string

  @ApiProperty()
  @Expose()
  sqrtPriceX96: string

  @ApiProperty()
  @Expose()
  liquidity: string

  @ApiProperty()
  @Expose()
  tick: number
} 