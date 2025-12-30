import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { CommentService } from './comment.service';
import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/decorators/user.decorator';
import { AddCommentDto } from './dto/add-comment.dto';

@Controller('api/comments')
@UseGuards(AuthGuard)
export class CommentController {
  constructor(private commentService: CommentService) {}

  @Post()
  async addComment(@UserId() userId: string, @Body() addCommentDto: AddCommentDto) {
    return this.commentService.addComment(userId, addCommentDto);
  }

  @Get(':taskId')
  async getTaskComments(@Param('taskId') taskId: string) {
    return this.commentService.getTaskComments(taskId);
  }
}


