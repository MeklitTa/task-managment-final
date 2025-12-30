import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddCommentDto } from './dto/add-comment.dto';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  async addComment(userId: string, addCommentDto: AddCommentDto) {
    const { content, taskId } = addCommentDto;

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

    const member = project.members.find((member) => member.userId === userId);
    if (!member) {
      throw new ForbiddenException('You are not a member of this project');
    }

    const comment = await this.prisma.comment.create({
      data: { taskId, content, userId },
      include: { user: true },
    });

    return { comment };
  }

  async getTaskComments(taskId: string) {
    const comments = await this.prisma.comment.findMany({
      where: { taskId },
      include: { user: true },
    });
    return { comments };
  }
}


