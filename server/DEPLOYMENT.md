# Vercel Deployment Guide

## Prerequisites

1. Ensure all environment variables are set in Vercel:
   - `DATABASE_URL` - Your PostgreSQL database connection string
   - `DIRECT_URL` - Direct database connection (for migrations)
   - `CLERK_SECRET_KEY` - Your Clerk secret key
   - `FRONTEND_URL` - Your frontend URL (for CORS)
   - `SMTP_USER` - Email service username
   - `SMTP_PASS` - Email service password
   - `SENDER_EMAIL` - Email sender address

## Vercel Project Settings

### If deploying from the `server` folder as root:

1. In Vercel project settings, set:
   - **Root Directory**: `server`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

2. The `vercel.json` in the server folder will automatically be used.

### If deploying from repository root:

1. You may need to create a root-level `vercel.json` or configure Vercel to build from the server folder.
2. Make sure the build command runs `cd server && npm install && npm run build`.

## Important Notes

- **Prisma Client Generation**: The `postinstall` script automatically runs `prisma generate` during deployment.
- **Serverless Function**: The entry point is `api/index.ts`, which wraps the NestJS app for serverless execution.
- **File System**: Serverless functions have a read-only file system except for `/tmp`. Prisma client must be generated during build.

## Troubleshooting

### Error: "Cannot read properties of undefined (reading 'fsPath')"

This error typically occurs when:
1. Prisma client wasn't generated during build - ensure `postinstall` script runs `prisma generate`
2. File paths are incorrect - ensure Prisma output is set to `./node_modules/.prisma/client` in `schema.prisma`
3. Build command isn't running - verify Vercel build logs show Prisma generation

### 404 Errors

1. Check that `vercel.json` paths are correct relative to the project root
2. Verify the function handler is exported correctly from `api/index.ts`
3. Ensure all routes are configured in `vercel.json`

