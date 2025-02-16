import { PartialType, PickType } from '@nestjs/swagger'
import { ProfileEntity } from '../entities/profile.entity'

export class _UpdateProfileDto extends PickType(ProfileEntity, ['email', 'avatar', 'name', 'dob']) {}
export class ProfileUpdateDto extends PartialType(_UpdateProfileDto) {}
