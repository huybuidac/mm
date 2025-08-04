import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import { IsArray, IsBoolean, IsNotEmpty, IsString, ValidateNested } from 'class-validator'

export class WalletConfigDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  privateKey: string

  @ApiProperty()
  @IsBoolean()
  @Expose()
  buyable: boolean

  @ApiProperty()
  @IsBoolean()
  @Expose()
  sellable: boolean
}

export class CreateBotTokenWalletsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  tokenAddress: string

  @ApiProperty({ type: () => WalletConfigDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WalletConfigDto)
  @Expose()
  wallets: WalletConfigDto[]
}
