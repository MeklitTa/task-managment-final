import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    try {
      // Check if auth() method exists (added by Clerk middleware)
      if (typeof request.auth !== 'function') {
        this.logger.error('Clerk auth() method not found on request. Make sure clerkMiddleware() is applied.');
        throw new UnauthorizedException('Authentication middleware not configured');
      }

      // Clerk Express middleware attaches auth() to request
      // This works with Bearer tokens sent from the frontend
      const authResult = await request.auth();
      const userId = authResult?.userId;
      
      if (!userId) {
        this.logger.warn('No userId found in auth result');
        throw new UnauthorizedException('Unauthorized - No user ID found');
      }

      // Attach userId to request for use in controllers
      request.userId = userId;
      return true;
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`, error.stack);
      
      // If it's already an HttpException, re-throw it
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      // Otherwise, wrap it in UnauthorizedException
      throw new UnauthorizedException(error.message || 'Unauthorized');
    }
  }
}

