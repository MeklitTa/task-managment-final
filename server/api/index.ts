import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import express from 'express';
import { clerkMiddleware } from '@clerk/express';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from '../src/common/http-exception.filter';

// Use require for serverless-http as it may not have TypeScript definitions
const serverless = require('serverless-http');

let cachedApp: express.Express;
let serverlessHandler: any;
let isInitializing = false;
let initializationError: Error | null = null;

async function bootstrap() {
  // If already initialized, return cached handler
  if (serverlessHandler) {
    return serverlessHandler;
  }

  // If initialization is in progress, wait for it
  if (isInitializing) {
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (initializationError) {
      throw initializationError;
    }
    return serverlessHandler;
  }

  // Start initialization
  isInitializing = true;
  initializationError = null;

  try {
    console.log('Starting NestJS application initialization...');
    
    // Check required environment variables
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    if (!process.env.CLERK_SECRET_KEY) {
      console.warn('CLERK_SECRET_KEY not set - authentication may not work');
    }
    
    const expressApp = express();
    
    console.log('Creating NestJS application...');
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
      { logger: ['error', 'warn', 'log'] } // Enable logging for debugging
    );

    console.log('Applying Clerk middleware...');
    // Apply Clerk middleware - only if CLERK_SECRET_KEY is available
    if (process.env.CLERK_SECRET_KEY) {
      app.use(
        clerkMiddleware({
          // Clerk will automatically use CLERK_SECRET_KEY from process.env
        })
      );
    } else {
      console.warn('Skipping Clerk middleware - CLERK_SECRET_KEY not set');
    }

    console.log('Enabling CORS...');
    // Enable CORS
    app.enableCors({
      origin: process.env.FRONTEND_URL || '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    console.log('Setting up global filters and pipes...');
    // Global exception filter
    app.useGlobalFilters(new AllExceptionsFilter());

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );

    console.log('Initializing NestJS application...');
    await app.init();
    
    cachedApp = expressApp;
    serverlessHandler = serverless(cachedApp, {
      binary: ['image/*', 'application/octet-stream'],
    });
    
    console.log('NestJS application initialized successfully');
    isInitializing = false;
    return serverlessHandler;
  } catch (error) {
    console.error('Failed to initialize NestJS application:', error);
    initializationError = error as Error;
    isInitializing = false;
    throw error;
  }
}

export default async function handler(event: any, context: any) {
  try {
    // Set callbackWaitsForEmptyEventLoop to false for better performance
    context.callbackWaitsForEmptyEventLoop = false;
    
    const handlerFn = await bootstrap();
    return await handlerFn(event, context);
  } catch (error) {
    console.error('Serverless function error:', error);
    
    // Return a proper error response
    return {
      statusCode: 500,
      body: JSON.stringify({
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Internal server error',
        error: 'FUNCTION_INVOCATION_FAILED',
        timestamp: new Date().toISOString(),
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }
}
