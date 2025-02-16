import { ApiProperty, OmitType } from '@nestjs/swagger'
import { Type as NestType } from '@nestjs/common'
import { Transform, Type } from 'class-transformer'
import { IsNumber, IsOptional, IsString } from 'class-validator'
import { Todo } from '@prisma/client'
// import { Type } from '@nestjs/common';
// export declare function OmitType<T, K extends keyof T>(classRef: Type<T>, keys: readonly K[]): Type<Omit<T, (typeof keys)[number]>>;

interface IPaginationDto {
  skip?: number
  take?: number
}

export type ClassType<T = any> = new (...args: any[]) => T

export function PaginatedRequestDto<Z, T extends ClassType, K extends keyof Z>(classRef: T, Select: K[]) {
  class Paginated implements IPaginationDto {
    @ApiProperty()
    @IsNumber()
    @Transform(({ value }) => Number(value))
    skip?: number

    @ApiProperty()
    @IsNumber()
    @Transform(({ value }) => Number(value))
    take?: number

    @ApiProperty({ type: () => Select })
    @IsOptional()
    select?: typeof Select

    @ApiProperty()
    @Type(() => classRef)
    query: ClassType<T>
  }

  return Paginated
}
