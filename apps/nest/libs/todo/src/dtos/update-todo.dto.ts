import { PartialType, PickType } from '@nestjs/swagger'
import { CreateTodoDto } from './create-todo.dto'

class _UpdateTodoDto extends PickType(CreateTodoDto, ['title', 'description']) {}
export class UpdateTodoDto extends PartialType(_UpdateTodoDto) {}
