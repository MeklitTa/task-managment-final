# Quick Setup Guide

## Prerequisites
- Node.js installed
- PostgreSQL database (or Neon account)
- Clerk account
- Brevo account (for emails)

## Step 1: Backend Setup

```bash
cd server
npm install
```

Create `.env` file in `server/`:
```env
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_database_url
CLERK_SECRET_KEY=your_clerk_secret_key
SMTP_USER=your_brevo_smtp_user
SMTP_PASS=your_brevo_smtp_password
SENDER_EMAIL=your_sender_email
PORT=5000
FRONTEND_URL=http://localhost:5173
```

Run Prisma migrations:
```bash
npx prisma migrate dev
```

Start the backend:
```bash
npm run start:dev
```

## Step 2: Frontend Setup

```bash
cd client
npm install
```

Create `.env` file in `client/`:
```env
VITE_BASEURL=http://localhost:5000
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

Start the frontend:
```bash
npm run dev
```

## Step 3: Verify Integration

1. Open `http://localhost:5173` in your browser
2. Log in with Clerk
3. You should see your workspaces loaded
4. Try creating a project or task to verify API calls work

## Troubleshooting

- **CORS errors**: Check `FRONTEND_URL` in backend `.env`
- **401 Unauthorized**: Verify `CLERK_SECRET_KEY` is correct
- **Connection refused**: Ensure backend is running on port 5000
- **404 Not Found**: Check API endpoint paths match

For more details, see `server/INTEGRATION.md`


