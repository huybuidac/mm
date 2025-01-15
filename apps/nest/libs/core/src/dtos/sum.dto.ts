import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'

export class SumDto {
  @Expose()
  @ApiProperty({ type: () => Number })
  sum: number
}
