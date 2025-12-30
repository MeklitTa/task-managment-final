import {
  Controller,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/decorators/user.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { DeleteTaskDto } from './dto/delete-task.dto';

@Controller('api/tasks')
@UseGuards(AuthGuard)
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Post()
  async createTask(
    @UserId() userId: string,
    @Body() createTaskDto: CreateTaskDto,
    @Req() req: any,
  ) {
    const origin = req.get('origin') || req.headers.origin || '';
    return this.taskService.createTask(userId, createTaskDto, origin);
  }

  @Put(':id')
  async updateTask(
    @UserId() userId: string,
    @Param('id') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.taskService.updateTask(userId, taskId, updateTaskDto);
  }

  @Post('delete')
  async deleteTask(
    @UserId() userId: string,
    @Body() deleteTaskDto: DeleteTaskDto,
  ) {
    return this.taskService.deleteTask(userId, deleteTaskDto);
  }
}


