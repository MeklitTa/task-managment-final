# Database Connection Troubleshooting

## Issue: WebSocket Connection Failed

If you're getting "All attempts to open a WebSocket to connect to the database failed", the code has been updated to use HTTP fetch instead of WebSocket, which is more reliable.

## Solution Applied

The Prisma service now uses:
- `poolQueryViaFetch = true` - Uses HTTP instead of WebSocket
- `fetchConnectionCache = true` - Caches connections for better performance

## Steps to Fix

1. **Restart the backend server:**
   ```bash
   cd server
   npm run start:dev
   ```

2. **Verify your `.env` file has the correct DATABASE_URL:**
   ```env
   DATABASE_URL=postgresql://user:password@host/database?sslmode=require
   ```
   
   Make sure:
   - The URL is from your Neon dashboard
   - It includes `?sslmode=require`
   - No extra spaces or quotes

3. **Check the backend console logs:**
   - You should see "Database connected successfully"
   - If you see errors, they will show the exact issue

## Common Issues

### 1. DATABASE_URL not set
**Error:** "DATABASE_URL environment variable is not set"
**Fix:** Add `DATABASE_URL` to your `.env` file

### 2. Invalid connection string
**Error:** Connection refused or authentication failed
**Fix:** 
- Get a fresh connection string from Neon dashboard
- Make sure it includes SSL parameters: `?sslmode=require`

### 3. Network/Firewall blocking
**Error:** Timeout or connection refused
**Fix:**
- Check if your network allows outbound connections
- Verify Neon database is active and accessible
- Try connecting from a different network

### 4. Database doesn't exist
**Error:** Database not found
**Fix:**
- Create the database in Neon dashboard
- Run migrations: `npx prisma migrate dev`

## Testing the Connection

You can test if the database connection works by running:

```bash
cd server
npx prisma db pull
```

If this works, your connection string is correct.

## Still Having Issues?

1. Check the backend console for detailed error messages
2. Verify all environment variables are set correctly
3. Make sure you're using the latest connection string from Neon
4. Try using the DIRECT_URL instead of DATABASE_URL if available

