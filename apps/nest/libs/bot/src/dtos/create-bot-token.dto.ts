import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsNotEmpty, IsString } from 'class-validator'

export class CreateBotTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  address: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  chainId: string
}