# Vercel Deployment Guide

## Prerequisites

1. Ensure all environment variables are set in Vercel:
   - `DATABASE_URL` - Your PostgreSQL database connection string (REQUIRED)
   - `DIRECT_URL` - Direct database connection (for migrations)
   - `CLERK_SECRET_KEY` - Your Clerk secret key (REQUIRED for auth)
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

### 500: INTERNAL_SERVER_ERROR - FUNCTION_INVOCATION_FAILED

This error indicates the serverless function is crashing during initialization. Check:

1. **Vercel Build Logs**: Look for error messages during the build phase
2. **Vercel Function Logs**: Check runtime logs in Vercel dashboard for specific error messages
3. **Common Causes**:
   - Missing `DATABASE_URL` environment variable
   - Missing `CLERK_SECRET_KEY` (warns but doesn't fail)
   - Prisma client not generated - check build logs for "prisma generate"
   - Module resolution issues - ensure all dependencies are in `package.json`
   - WebSocket issues with Neon - the code now falls back to fetch-based connections

### Debugging Steps:

1. **Check Build Logs**:
   - Go to Vercel Dashboard → Your Project → Deployments → Click on failed deployment
   - Look for errors in the "Building" section
   - Verify "prisma generate" ran successfully
   - Check if TypeScript compilation succeeded

2. **Check Function Logs**:
   - Go to Vercel Dashboard → Your Project → Functions → Click on the function
   - Look at runtime logs for error messages
   - The updated code includes console.log statements for debugging initialization

3. **Verify Environment Variables**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Ensure `DATABASE_URL` is set correctly
   - Ensure `CLERK_SECRET_KEY` is set if using authentication

4. **Test Locally** (if possible):
   ```bash
   cd server
   npm install
   npm run build
   # Test the built application
   ```

### 404 Errors

1. Check that `vercel.json` paths are correct relative to the project root
2. Verify the function handler is exported correctly from `api/index.ts`
3. Ensure all routes are configured in `vercel.json`

### Prisma Issues in Serverless

The code has been updated to:
- Use fetch-based connections for Neon (works better in serverless)
- Handle missing WebSocket package gracefully
- Provide better error messages if Prisma fails to initialize

If Prisma still fails:
- Ensure `DATABASE_URL` is correctly formatted
- Check that `postinstall` script runs `prisma generate` in build logs
- Verify Prisma client is generated in `node_modules/.prisma/client`
