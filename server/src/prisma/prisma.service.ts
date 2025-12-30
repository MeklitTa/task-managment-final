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
} catch (error) {
  // In serverless environments, WebSocket might not be available
  // But Neon can use fetch-based connections which work in serverless
  console.warn('WebSocket (ws) package not available, using fetch-based connections');
}

// Enable fetch-based querying as fallback (more reliable in serverless)
// This uses HTTP instead of WebSocket when possible
if (typeof neonConfig.poolQueryViaFetch !== 'undefined') {
  neonConfig.poolQueryViaFetch = true;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      const error = new Error('DATABASE_URL environment variable is not set');
      console.error(error.message);
      throw error;
    }

    // Create adapter before calling super()
    let adapter: PrismaNeon;
    try {
      adapter = new PrismaNeon({ connectionString });
    } catch (error) {
      const errorMsg = `Failed to create Prisma adapter: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMsg, error);
      throw new Error(errorMsg);
    }

    // Configure Prisma client options
    const prismaOptions: any = {
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    };

    // super() must be a root-level statement
    super(prismaOptions);
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


