# Setup Instructions

## Prerequisites

- Node.js 18+ and pnpm installed
- PostgreSQL database (cloud or local) with connection string
- Git

## Installation

1. **Install dependencies:**
```bash
pnpm install
```

2. **Setup Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env with your database connection string and JWT secret
```

3. **Setup Database:**
```bash
cd backend
pnpm prisma:generate
pnpm prisma:migrate
```

4. **Seed Database (Create Admin User):**
```bash
cd backend
pnpm prisma:seed
```

This will create:
- ADMIN and STAFF roles
- Default admin user with credentials:
  - Email: `admin@example.com` (or set `ADMIN_EMAIL` in .env)
  - Password: `admin123` (or set `ADMIN_PASSWORD` in .env)
  - Name: `Admin User` (or set `ADMIN_NAME` in .env)

**⚠️ IMPORTANT:** Change the admin password after first login!

## Running the Application

### Development Mode

From the root directory:
```bash
pnpm dev
```

This will start both backend (port 3001) and frontend (port 5173) concurrently.

Or run separately:
```bash
# Terminal 1 - Backend
pnpm backend:dev

# Terminal 2 - Frontend
pnpm frontend:dev
```

### Production Build

```bash
pnpm build
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Optional: Customize default admin user (for seed script)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Admin User
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
```

## First User Setup

### Option 1: Use Seed Script (Recommended)
1. Run the seed script: `cd backend && pnpm prisma:seed`
2. Login with the default admin credentials
3. Change the admin password after first login
4. Create additional users through the Users & Roles page (Admin only)

### Option 2: Register New User
1. Start the application
2. Navigate to http://localhost:5173
3. Register a new user (will be assigned STAFF role by default)
4. To upgrade to ADMIN, an existing admin must update the user's role through the Users & Roles page

## API Endpoints

All API endpoints are prefixed with `/api`:

- `/api/auth` - Authentication (register, login)
- `/api/users` - User management (Admin only)
- `/api/contacts` - Contact management
- `/api/items` - Item management
- `/api/quotes` - Quote management
- `/api/invoices` - Invoice management
- `/api/projects` - Project management
- `/api/timesheets` - Timesheet management
- `/api/templates` - Template management

## Key Features Implemented

✅ User authentication with JWT
✅ Role-based access control (Admin/Staff)
✅ Contacts (Customers/Vendors)
✅ Items with tax rates
✅ Quotes with status lifecycle
✅ Invoices with auto-numbering
✅ Projects with hourly rates
✅ Timesheets with billable hours
✅ Templates for invoices/quotes
✅ Quote to Invoice conversion
✅ Timesheet to Invoice conversion

## Testing the Application

1. Register/Login
2. Create a Contact (Customer)
3. Create Items
4. Create a Quote with items
5. Accept the Quote
6. Convert Quote to Invoice
7. Create a Project
8. Log Timesheet entries
9. Add billable hours to an Invoice

## Troubleshooting

- **Database connection issues**: Verify DATABASE_URL in backend/.env
- **CORS errors**: Check FRONTEND_URL in backend/.env matches your frontend URL
- **Prisma errors**: Run `pnpm prisma:generate` in backend directory
- **Port conflicts**: Change PORT in backend/.env or frontend vite.config.ts

