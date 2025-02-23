import { Injectable } from '@nestjs/common'
import { PrismaService } from 'nestjs-prisma'
import { CreateTodoDto } from './dtos/create-todo.dto'
import { UpdateTodoDto } from './dtos/update-todo.dto'
import { QueryTodoDto } from './dtos/query-todo.dto'
import { User } from '@prisma/client'
import { th } from '@app/helper/transform.helper'
import { TodoEntity } from './entities/todo.entity'

@Injectable()
export class TodoService {
  constructor(private readonly prisma: PrismaService) {}

  async getTodos(queryTodoDto: QueryTodoDto) {
    const { select, include } = queryTodoDto
    const todos = await this.prisma.todo.findMany({
      where: queryTodoDto.where,
      orderBy: queryTodoDto.sort,
      take: queryTodoDto.take,
      skip: queryTodoDto.skip,
      ...(select
        ? { select: Object.fromEntries(select.map((key) => [key, true])) }
        : include
          ? { include: Object.fromEntries(include.map((key) => [key, true])) }
          : {}),
    })
    return th.toInstancesSafe(TodoEntity, todos)
  }

  async getTodo(id: bigint) {
    const todo = await this.prisma.todo.findUniqueOrThrow({
      where: { id },
    })
    return th.toInstanceSafe(TodoEntity, todo)
  }

  async createTodo(dto: CreateTodoDto, user: User) {
    const todo = await this.prisma.todo.create({
      data: {
        ...dto,
        profileId: user.profileId,
      },
    })
    return th.toInstanceSafe(TodoEntity, todo)
  }

  async updateTodo(id: bigint, dto: UpdateTodoDto, user: User) {
    const todo = await this.prisma.todo.update({
      where: { id, profileId: user.profileId },
      data: dto,
    })
    return th.toInstanceSafe(TodoEntity, todo)
  }

  async deleteTodo(id: bigint, user: User) {
    await this.prisma.todo.delete({
      where: { id, profileId: user.profileId },
    })
  }
}
