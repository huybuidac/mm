import { Exclude, Expose } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'

export class BotWalletEntity {
  @ApiProperty()
  @Expose()
  address: string

  @ApiProperty()
  @Exclude()
  privateKey: string

  @ApiProperty()
  @Expose()
  createdAt: Date

  @ApiProperty()
  @Expose()
  updatedAt: Date
}
