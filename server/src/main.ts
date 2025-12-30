import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { clerkMiddleware } from "@clerk/express";
import { AllExceptionsFilter } from "./common/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with proper configuration for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Vite default port
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // Apply Clerk middleware - this handles authentication
  // Clerk middleware automatically reads CLERK_SECRET_KEY from environment
  app.use(
    clerkMiddleware({
      // Clerk will automatically use CLERK_SECRET_KEY from process.env
      // No need to pass it explicitly as it's read from environment
    })
  );

  // Global exception filter for better error handling
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`Server is running on port ${port}`);
  console.log(
    `CORS enabled for: ${process.env.FRONTEND_URL || "http://localhost:5173"}`
  );
}
bootstrap();
