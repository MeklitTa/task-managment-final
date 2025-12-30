import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddProjectMemberDto } from './dto/add-member.dto';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async createProject(userId: string, createProjectDto: CreateProjectDto) {
    const {
      workspaceId,
      description,
      name,
      status,
      start_date,
      end_date,
      team_members,
      team_lead,
      progress,
      priority,
    } = createProjectDto;

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: { include: { user: true } } },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const isAdmin = workspace.members.some(
      (member) => member.userId === userId && member.role === 'ADMIN',
    );

    if (!isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to create projects in this workspace',
      );
    }

    const teamLeadUser = await this.prisma.user.findUnique({
      where: { email: team_lead },
      select: { id: true },
    });

    const project = await this.prisma.project.create({
      data: {
        workspaceId,
        name,
        description,
        status: status || 'ACTIVE',
        priority: priority || 'MEDIUM',
        progress: progress || 0,
        team_lead: teamLeadUser?.id,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
      },
    });

    if (team_members?.length > 0) {
      const membersToAdd = [];

      workspace.members.forEach((member) => {
        if (team_members.includes(member.user.email)) {
          membersToAdd.push(member.user.id);
        }
      });

      if (membersToAdd.length > 0) {
        await this.prisma.projectMember.createMany({
          data: membersToAdd.map((memberId) => ({
            projectId: project.id,
            userId: memberId,
          })),
        });
      }
    }

    const projectWithMembers = await this.prisma.project.findUnique({
      where: { id: project.id },
      include: {
        members: { include: { user: true } },
        tasks: {
          include: { assignee: true, comments: { include: { user: true } } },
        },
        owner: true,
      },
    });

    return {
      project: projectWithMembers,
      message: 'Project created successfully',
    };
  }

  async updateProject(userId: string, updateProjectDto: UpdateProjectDto) {
    const {
      id,
      workspaceId,
      description,
      name,
      status,
      start_date,
      end_date,
      progress,
      priority,
    } = updateProjectDto;

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: { include: { user: true } } },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const isAdmin = workspace.members.some(
      (member) => member.userId === userId && member.role === 'ADMIN',
    );

    if (!isAdmin) {
      const project = await this.prisma.project.findUnique({
        where: { id },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      if (project.team_lead !== userId) {
        throw new ForbiddenException(
          'You do not have permission to update projects in this workspace',
        );
      }
    }

    // Build update data object, only including fields that are provided
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (progress !== undefined) updateData.progress = progress;
    if (workspaceId !== undefined) updateData.workspaceId = workspaceId;
    if (start_date !== undefined) {
      updateData.start_date = start_date ? new Date(start_date) : null;
    }
    if (end_date !== undefined) {
      updateData.end_date = end_date ? new Date(end_date) : null;
    }

    const project = await this.prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        members: { include: { user: true } },
        tasks: {
          include: {
            assignee: true,
            comments: { include: { user: true } },
          },
        },
      },
    });

    return { project, message: 'Project updated successfully' };
  }

  async addMember(userId: string, projectId: string, addMemberDto: AddProjectMemberDto) {
    const { email } = addMemberDto;

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { include: { user: true } } },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.team_lead !== userId) {
      throw new ForbiddenException('Only project lead can add members');
    }

    const existingMember = project.members.find(
      (member) => member.user.email === email,
    );

    if (existingMember) {
      throw new BadRequestException('User is already a member');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const member = await this.prisma.projectMember.create({
      data: { userId: user.id, projectId },
    });

    return { member, message: 'Member added successfully' };
  }
}


