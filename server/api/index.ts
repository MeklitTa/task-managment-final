import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import * as express from 'express';
import serverless from 'serverless-http';
import { clerkMiddleware } from '@clerk/express';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from '../src/common/http-exception.filter';

let cachedApp: express.Express;
let serverlessHandler: any;

async function bootstrap() {
  if (!cachedApp) {
    const expressApp = express();
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
      { logger: false }
    );

    // Apply Clerk middleware
    app.use(
      clerkMiddleware({
        // Clerk will automatically use CLERK_SECRET_KEY from process.env
      })
    );

    // Enable CORS
    app.enableCors({
      origin: process.env.FRONTEND_URL || '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

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

    await app.init();
    cachedApp = expressApp;
    serverlessHandler = serverless(cachedApp);
  }
  return serverlessHandler;
}

export default async function handler(event: any, context: any) {
  const handlerFn = await bootstrap();
  return handlerFn(event, context);
}
