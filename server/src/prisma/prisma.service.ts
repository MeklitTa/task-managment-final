import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';

// Configure Neon WebSocket constructor for Node.js environment
// This is required for Neon serverless to work properly
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ws = require('ws');
  // Set the WebSocket constructor - this is required for Neon
  neonConfig.webSocketConstructor = ws;
  
  // Enable fetch-based querying as fallback (more reliable)
  // This uses HTTP instead of WebSocket when possible
  if (typeof neonConfig.poolQueryViaFetch !== 'undefined') {
    neonConfig.poolQueryViaFetch = true;
  }
} catch (error) {
  console.error('Failed to configure WebSocket for Neon:', error);
  throw new Error('WebSocket package (ws) is required for Neon database connections');
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Create adapter before calling super()
    let adapter: PrismaNeon;
    try {
      adapter = new PrismaNeon({ connectionString });
    } catch (error) {
      console.error('Failed to create Prisma adapter:', error);
      throw error;
    }
    
    // super() must be called at root level, not inside try-catch
    super({
      adapter,
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}


