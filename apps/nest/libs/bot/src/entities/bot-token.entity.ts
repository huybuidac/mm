import { Expose } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'

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
  createdAt: Date

  @ApiProperty()
  @Expose()
  updatedAt: Date
}
