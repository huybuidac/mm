import { ParseBigIntPipe } from '@app/core/pipes/parse-bigint.pipe'
import { CreateTodoDto } from './dtos/create-todo.dto'
import { TodoService } from './todo.service'

import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, UseInterceptors } from '@nestjs/common'
import { UpdateTodoDto } from './dtos/update-todo.dto'
import { QueryTodoDto } from './dtos/query-todo.dto'
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { JwtGuard } from '@app/auth/guards/jwt.guard'
import { TodoEntity } from './entities/todo.entity'
import { CacheTTL } from '@nestjs/cache-manager'
import { AppCacheInterceptor } from '@app/core/interceptors/app-cache-interceptor'
import { AppCacheKey } from '@app/core/decorators/app-cache-key.decorator'
import { CurUser } from '@app/core/decorators/user.decorator'
import { User } from '@prisma/client'
import { RawQuery } from '@app/core/decorators/query.decorator'

@Controller('todo')
@ApiTags('Todo')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOkResponse({ type: () => TodoEntity, isArray: true })
  @UseGuards(JwtGuard)
  @CacheTTL(2000)
  @UseInterceptors(AppCacheInterceptor)
  getTodos(@RawQuery() queryTodoDto: QueryTodoDto) {
    return this.todoService.getTodos(queryTodoDto)
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOkResponse({ type: () => TodoEntity })
  @UseGuards(JwtGuard)
  @CacheTTL(2000)
  @AppCacheKey((req) => `todo-${req.params.id}`)
  @UseInterceptors(AppCacheInterceptor)
  getTodo(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.todoService.getTodo(id)
  }

  @Post()
  @ApiBearerAuth()
  @ApiOkResponse({ type: () => TodoEntity })
  @UseGuards(JwtGuard)
  createTodo(@Body() createTodoDto: CreateTodoDto, @CurUser() user: User) {
    return this.todoService.createTodo(createTodoDto, user)
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOkResponse({ type: () => TodoEntity })
  @UseGuards(JwtGuard)
  updateTodo(@Param('id', ParseBigIntPipe) id: bigint, @Body() updateTodoDto: UpdateTodoDto, @CurUser() user: User) {
    return this.todoService.updateTodo(id, updateTodoDto, user)
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOkResponse({ type: () => TodoEntity })
  @UseGuards(JwtGuard)
  deleteTodo(@Param('id', ParseBigIntPipe) id: bigint, @CurUser() user: User) {
    return this.todoService.deleteTodo(id, user)
  }
}
