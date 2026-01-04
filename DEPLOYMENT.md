# Deployment Guide - Free Hosting Options

This guide will help you deploy your Zoho Invoice application to free hosting platforms. Since you don't have a server, we'll use cloud platforms that offer free tiers.

## 🎯 Recommended Options

### Option 1: Render (Recommended - Easiest)
**Free Tier:**
- 750 hours/month (enough for 24/7)
- Free PostgreSQL database
- Automatic SSL certificates
- Easy setup with GitHub integration

**Limitations:**
- Services spin down after 15 minutes of inactivity (freezes on first request)
- 512MB RAM

### Option 2: Railway
**Free Tier:**
- $5 credit/month (usually enough for small apps)
- Free PostgreSQL database
- No spin-down issues
- Fast deployment

**Limitations:**
- Credit-based (may need to upgrade after free credit)

### Option 3: Fly.io
**Free Tier:**
- 3 shared-cpu VMs
- 3GB persistent volume storage
- 160GB outbound data transfer

**Limitations:**
- More complex setup
- Requires Docker

---

## 🚀 Deployment Steps

### Prerequisites
1. GitHub account
2. Push your code to a GitHub repository
3. Choose one of the platforms above

---

## 📋 Option 1: Deploy to Render

### Step 1: Prepare Your Repository
1. Push your code to GitHub
2. Make sure you have a `.gitignore` file (should already exist)

### Step 2: Create PostgreSQL Database on Render
1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "PostgreSQL"
3. Configure:
   - **Name**: `zoho-invoice-db`
   - **Database**: `zohoinvoice`
   - **User**: `zohoinvoice` (auto-generated)
   - **Region**: Choose closest to you
   - **Plan**: Free
4. Click "Create Database"
5. **Copy the Internal Database URL** (you'll need this later)

### Step 3: Deploy Backend
1. In Render dashboard, click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `zoho-invoice-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free
4. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<paste-internal-database-url-from-step-2>
   JWT_SECRET=<generate-a-random-secret-key>
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=https://your-frontend-url.onrender.com
   ```
5. Click "Create Web Service"
6. **Copy the backend URL** (e.g., `https://zoho-invoice-backend.onrender.com`)

### Step 4: Run Database Migrations
1. In Render dashboard, go to your backend service
2. Click "Shell" tab
3. Run:
   ```bash
   cd backend
   npx prisma generate
   npx prisma migrate deploy
   npx tsx prisma/seed.ts
   ```

### Step 5: Deploy Frontend
1. In Render dashboard, click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `zoho-invoice-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
4. Add Environment Variable:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```
5. Click "Create Static Site"
6. **Update Backend CORS**: Go back to backend service, update `FRONTEND_URL` to your frontend URL

### Step 6: Update Environment Variables
1. Update backend `FRONTEND_URL` to your frontend URL
2. Update frontend `VITE_API_URL` to your backend URL

---

## 📋 Option 2: Deploy to Railway

### Step 1: Install Railway CLI
```bash
npm i -g @railway/cli
railway login
```

### Step 2: Create PostgreSQL Database
1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "New Database" → "PostgreSQL"
3. Click on the database → "Variables" tab
4. Copy the `DATABASE_URL`

### Step 3: Deploy Backend
1. In your project root, run:
   ```bash
   railway init
   railway link
   ```
2. Create `railway.json` in project root (already created for you)
3. Set environment variables:
   ```bash
   railway variables set NODE_ENV=production
   railway variables set PORT=3001
   railway variables set DATABASE_URL=<your-database-url>
   railway variables set JWT_SECRET=<generate-secret>
   railway variables set JWT_EXPIRES_IN=7d
   railway variables set FRONTEND_URL=<will-update-after-frontend-deploy>
   ```
4. Deploy:
   ```bash
   railway up
   ```

### Step 4: Run Migrations
```bash
railway run cd backend && npx prisma generate && npx prisma migrate deploy && npx tsx prisma/seed.ts
```

### Step 5: Deploy Frontend
1. Create a new service in Railway
2. Configure build settings to use the frontend directory
3. Set `VITE_API_URL` environment variable

---

## 📋 Option 3: Deploy to Fly.io

### Step 1: Install Fly CLI
```bash
curl -L https://fly.io/install.sh | sh
fly auth login
```

### Step 2: Create PostgreSQL Database
```bash
fly postgres create --name zoho-invoice-db --region <your-region>
fly postgres attach zoho-invoice-db
```

### Step 3: Deploy Backend
1. The Dockerfile is already created
2. Run:
   ```bash
   fly launch --name zoho-invoice-backend
   ```
3. Set secrets:
   ```bash
   fly secrets set NODE_ENV=production
   fly secrets set JWT_SECRET=<your-secret>
   fly secrets set JWT_EXPIRES_IN=7d
   fly secrets set FRONTEND_URL=<will-update-later>
   ```

### Step 4: Run Migrations
```bash
fly ssh console -a zoho-invoice-backend
cd backend
npx prisma generate
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

### Step 5: Deploy Frontend
Deploy frontend as a separate Fly.io app or use a static hosting service like Vercel/Netlify.

---

## 🔐 Generating Secure Secrets

For `JWT_SECRET`, generate a secure random string:

**Linux/Mac:**
```bash
openssl rand -base64 32
```

**Or use Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 📝 Environment Variables Summary

### Backend (.env)
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-frontend-url.com

# Optional
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Admin User
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend-url.com/api
```

---

## 🐳 Docker Deployment (Alternative)

If you prefer Docker, use the provided `Dockerfile`:

```bash
# Build
docker build -t zoho-invoice-backend .

# Run
docker run -p 3001:3001 \
  -e DATABASE_URL=your-db-url \
  -e JWT_SECRET=your-secret \
  -e FRONTEND_URL=http://localhost:5173 \
  zoho-invoice-backend
```

---

## ✅ Post-Deployment Checklist

- [ ] Database migrations run successfully
- [ ] Database seeded with admin user
- [ ] Backend health check works (`/health` endpoint)
- [ ] Frontend can connect to backend API
- [ ] CORS configured correctly
- [ ] Environment variables set correctly
- [ ] SSL certificates active (automatic on Render/Railway)
- [ ] Test login with admin credentials
- [ ] Change default admin password

---

## 🐛 Troubleshooting

### Backend won't start
- Check environment variables are set correctly
- Verify DATABASE_URL is correct
- Check build logs for errors

### Database connection errors
- Verify DATABASE_URL format
- Check database is running
- Ensure network access is allowed

### CORS errors
- Verify FRONTEND_URL matches your frontend domain exactly
- Check backend CORS configuration

### Frontend can't connect to backend
- Verify VITE_API_URL is set correctly
- Check backend is running
- Verify CORS settings

### Puppeteer issues (PDF generation)
- Some free tiers may not support Puppeteer
- Consider using a headless browser service or alternative PDF library

---

## 💡 Tips

1. **Start with Render** - It's the easiest for beginners
2. **Use environment variables** - Never commit secrets to Git
3. **Monitor your usage** - Free tiers have limits
4. **Backup your database** - Export data regularly
5. **Use a custom domain** - Most platforms support it (may require paid plan)

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Fly.io Documentation](https://fly.io/docs)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)

---

## 🆘 Need Help?

If you encounter issues:
1. Check the platform's logs
2. Verify all environment variables
3. Test database connection separately
4. Check platform status pages

Good luck with your deployment! 🚀


