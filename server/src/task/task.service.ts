import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InngestService } from '../inngest/inngest.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { DeleteTaskDto } from './dto/delete-task.dto';

@Injectable()
export class TaskService {
  constructor(
    private prisma: PrismaService,
    private inngestService: InngestService,
  ) {}

  async createTask(userId: string, createTaskDto: CreateTaskDto, origin: string) {
    const {
      projectId,
      title,
      description,
      type,
      status,
      priority,
      assigneeId,
      due_date,
    } = createTaskDto;

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { include: { user: true } } },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.team_lead !== userId) {
      throw new ForbiddenException(
        'You do not have admin privileges for this project',
      );
    }

    if (
      assigneeId &&
      !project.members.find((member) => member.user.id === assigneeId)
    ) {
      throw new ForbiddenException('Assignee is not a member of the project');
    }

    const task = await this.prisma.task.create({
      data: {
        projectId,
        title,
        description,
        priority: priority || 'MEDIUM',
        assigneeId: assigneeId || project.team_lead,
        status: status || 'TODO',
        type: type || 'TASK',
        due_date: new Date(due_date),
      },
    });

    const taskWithAssignee = await this.prisma.task.findUnique({
      where: { id: task.id },
      include: { assignee: true },
    });

    // Send Inngest event for email notification
    await this.inngestService.sendEvent('app/task.assigned', {
      taskId: task.id,
      origin,
    });

    return {
      task: taskWithAssignee,
      message: 'Task created successfully',
    };
  }

  async updateTask(userId: string, taskId: string, updateTaskDto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: task.projectId },
      include: { members: { include: { user: true } } },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.team_lead !== userId) {
      throw new ForbiddenException(
        'You do not have admin privileges for this project',
      );
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: updateTaskDto,
      include: {
        assignee: true,
        project: true,
      },
    });

    return { task: updatedTask, message: 'Task updated successfully' };
  }

  async deleteTask(userId: string, deleteTaskDto: DeleteTaskDto) {
    const { taskIds } = deleteTaskDto;

    const tasks = await this.prisma.task.findMany({
      where: { id: { in: taskIds } },
    });

    if (tasks.length === 0) {
      throw new NotFoundException('Task not found');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: tasks[0].projectId },
      include: { members: { include: { user: true } } },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.team_lead !== userId) {
      throw new ForbiddenException(
        'You do not have admin privileges for this project',
      );
    }

    await this.prisma.task.deleteMany({ where: { id: { in: taskIds } } });

    return { message: 'Task deleted successfully' };
  }
}


