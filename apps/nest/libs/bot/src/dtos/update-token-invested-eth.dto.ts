import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsNotEmpty, IsString } from 'class-validator'

export class UpdateTokenInvestedEthDto {
  @ApiProperty({ description: 'The new invested ETH amount', example: '1000000000000000000' })
  @IsString()
  @IsNotEmpty()
  @Expose()
  investedEth: string
}
