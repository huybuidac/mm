import { Expose, Transform } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'
import { Decimal } from '@prisma/client/runtime/library'

export class BotTokenEntity {
  @ApiProperty()
  @Expose()
  address: string

  @ApiProperty()
  @Expose()
  chainId: string

  @ApiProperty()
  @Expose()
  enabled: boolean

  @ApiProperty()
  @Expose()
  fee: number

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => value.toString())
  investedEth: Decimal

  @ApiProperty()
  @Expose()
  createdAt: Date

  @ApiProperty()
  @Expose()
  updatedAt: Date
}
