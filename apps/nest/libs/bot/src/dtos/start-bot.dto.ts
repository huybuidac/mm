import { ApiProperty } from '@nestjs/swagger'
import { Expose, Transform } from 'class-transformer'
import { IsNotEmpty, IsString, IsNumber, IsPositive, IsNumberString } from 'class-validator'

export class StartBotDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => BigInt(value))
  @Expose()
  sellVolume: bigint

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => BigInt(value))
  @Expose()
  sellOrder: bigint

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => BigInt(value))
  @Expose()
  buyVolume: bigint

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => BigInt(value))
  @Expose()
  buyOrder: bigint

  @ApiProperty()
  @IsNumberString()
  @IsPositive()
  @Expose()
  sellDelay: number

  @ApiProperty()
  @IsNumberString()
  @IsPositive()
  @Expose()
  duration: number
}
