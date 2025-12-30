# Migration from Express.js to NestJS

This document outlines the changes made when converting the backend from Express.js to NestJS.

## Structure Changes

### Old Structure (Express.js)
```
server/
├── configs/
│   ├── nodemailer.js
│   └── prisma.js
├── controllers/
│   ├── commentController.js
│   ├── projectController.js
│   ├── taskController.js
│   └── workspaceController.js
├── middlewares/
│   └── authMiddleware.js
├── routes/
│   ├── commentRoute.js
│   ├── projectRoute.js
│   ├── taskRoute.js
│   └── workspaceRoutes.js
├── inngest/
│   └── index.js
└── server.js
```

### New Structure (NestJS)
```
server/
├── src/
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── email/
│   │   ├── email.module.ts
│   │   └── email.service.ts
│   ├── inngest/
│   │   ├── inngest.module.ts
│   │   ├── inngest.service.ts
│   │   └── inngest.controller.ts
│   ├── auth/
│   │   ├── auth.guard.ts
│   │   └── decorators/
│   │       └── user.decorator.ts
│   ├── workspace/
│   │   ├── workspace.module.ts
│   │   ├── workspace.controller.ts
│   │   ├── workspace.service.ts
│   │   └── dto/
│   │       └── add-member.dto.ts
│   ├── project/
│   │   ├── project.module.ts
│   │   ├── project.controller.ts
│   │   ├── project.service.ts
│   │   └── dto/
│   │       ├── create-project.dto.ts
│   │       ├── update-project.dto.ts
│   │       └── add-member.dto.ts
│   ├── task/
│   │   ├── task.module.ts
│   │   ├── task.controller.ts
│   │   ├── task.service.ts
│   │   └── dto/
│   │       ├── create-task.dto.ts
│   │       ├── update-task.dto.ts
│   │       └── delete-task.dto.ts
│   ├── comment/
│   │   ├── comment.module.ts
│   │   ├── comment.controller.ts
│   │   ├── comment.service.ts
│   │   └── dto/
│   │       └── add-comment.dto.ts
│   ├── app.module.ts
│   ├── app.controller.ts
│   └── main.ts
├── tsconfig.json
└── nest-cli.json
```

## Key Changes

### 1. Module-Based Architecture
- Each feature (workspace, project, task, comment) is now a self-contained module
- Modules encapsulate controllers, services, and DTOs
- Global modules (Prisma, Email) are shared across the application

### 2. Dependency Injection
- Services are injected via constructor injection
- No more direct imports of Prisma or other services
- Better testability and maintainability

### 3. DTOs (Data Transfer Objects)
- Request validation using `class-validator`
- Type safety with TypeScript
- Automatic validation via `ValidationPipe`

### 4. Guards Instead of Middleware
- `AuthGuard` replaces `authMiddleware.js`
- Uses Clerk Express middleware via `clerkMiddleware()` in `main.ts`
- Custom decorator `@UserId()` for easy access to authenticated user ID

### 5. Services for Business Logic
- Controllers are thin - they only handle HTTP requests/responses
- Business logic moved to services
- Better separation of concerns

### 6. Error Handling
- Uses NestJS built-in exception filters
- Proper HTTP status codes (NotFoundException, ForbiddenException, etc.)
- Consistent error responses

## API Endpoints (Unchanged)

All API endpoints remain the same:
- `GET /api/workspaces` - Get user workspaces
- `POST /api/workspaces/add-member` - Add member to workspace
- `POST /api/projects` - Create project
- `PUT /api/projects` - Update project
- `POST /api/projects/:projectId/addMember` - Add member to project
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `POST /api/tasks/delete` - Delete tasks
- `POST /api/comments` - Add comment
- `GET /api/comments/:taskId` - Get task comments
- `ALL /api/inngest/*` - Inngest webhook handler

## Running the Application

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

## Environment Variables

No changes to environment variables required:
- `DATABASE_URL`
- `DIRECT_URL`
- `CLERK_SECRET_KEY`
- `SMTP_USER`
- `SMTP_PASS`
- `SENDER_EMAIL`
- `PORT`

## Next Steps

1. Install dependencies: `npm install`
2. Generate Prisma client: `npm run postinstall`
3. Run migrations if needed: `npx prisma migrate dev`
4. Start the server: `npm run start:dev`

## Notes

- The old Express.js files are still in the repository but are no longer used
- All functionality has been preserved
- Email sending improvements (error handling, logging) are included
- TypeScript provides better type safety throughout the application


