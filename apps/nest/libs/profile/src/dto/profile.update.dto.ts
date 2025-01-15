import { ApiProperty, PartialType, PickType } from '@nestjs/swagger'
import { ProfileEntity } from '../entities/profile.entity'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'

export class _UpdateProfileDto extends PickType(ProfileEntity, ['email', 'avatar', 'name', 'dob']) {}
export class ProfileUpdateDto extends PartialType(_UpdateProfileDto) {}

export class ProfileUpdateAccountNameDto extends PickType(ProfileEntity, ['accountName']) {
  @Expose()
  @ApiProperty({ example: 'anyaQuote', type: () => String })
  @IsNotEmpty()
  accountName: string
}
