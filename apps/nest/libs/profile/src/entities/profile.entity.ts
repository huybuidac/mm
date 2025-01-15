import { ApiProperty } from '@nestjs/swagger'
import { Profile, Role } from '@prisma/client'
import { Expose } from 'class-transformer'
import { IsEmail } from 'class-validator'

export class ProfileEntity implements Profile {
  @Expose()
  @ApiProperty({ type: () => Date, nullable: true })
  dob: Date | null

  @Expose()
  @ApiProperty({ type: () => Date })
  readNotiAt: Date

  @Expose()
  @ApiProperty({ type: () => 'bigint' })
  channelId: bigint

  @Expose()
  @ApiProperty({ type: () => String })
  accountName: string

  @Expose()
  @ApiProperty({ type: () => Role, enum: Role })
  role: Role

  @Expose()
  @ApiProperty({ example: '1/public/myimage.png', type: () => String, nullable: true })
  avatar: string | null

  @Expose()
  @ApiProperty({ type: () => Date })
  createdAt: Date

  @Expose()
  @ApiProperty({ type: () => Date })
  updatedAt: Date

  @Expose()
  @ApiProperty({ example: 999, type: () => 'bigint' })
  id: bigint

  @Expose()
  @ApiProperty({ example: 'Harry', type: () => String })
  name: string

  @Expose()
  @IsEmail()
  @ApiProperty({ example: 'Harry@gmail.com', type: () => String, nullable: true })
  email: string | null

  // relations
}
