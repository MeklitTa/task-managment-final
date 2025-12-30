import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/decorators/user.decorator';
import { AddMemberDto } from './dto/add-member.dto';
import { InviteMemberDto } from './dto/invite-member.dto';

@Controller('api/workspaces')
@UseGuards(AuthGuard)
export class WorkspaceController {
  constructor(private workspaceService: WorkspaceService) {}

  @Get()
  async getUserWorkspaces(@UserId() userId: string) {
    return this.workspaceService.getUserWorkspaces(userId);
  }

  @Post('add-member')
  async addMember(@UserId() userId: string, @Body() addMemberDto: AddMemberDto) {
    return this.workspaceService.addMember(userId, addMemberDto);
  }

  @Post('invite-member')
  async inviteMember(@UserId() userId: string, @Body() inviteMemberDto: InviteMemberDto) {
    return this.workspaceService.inviteMember(userId, inviteMemberDto);
  }
}


