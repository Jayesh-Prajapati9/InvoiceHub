# Quick Deployment Guide

## 🚀 Fastest Way: Render (Recommended for Beginners)

### Step-by-Step (15 minutes)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Create Database on Render**
   - Go to [render.com](https://render.com) → Sign up
   - Click "New +" → "PostgreSQL"
   - Name: `zoho-invoice-db`
   - Plan: **Free**
   - Click "Create Database"
   - **Copy the Internal Database URL**

3. **Deploy Backend**
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Settings:
     - **Name**: `zoho-invoice-backend`
     - **Root Directory**: Leave empty
     - **Environment**: `Node`
     - **Build Command**: `cd backend && npm install && npm run build && npx prisma generate`
     - **Start Command**: `cd backend && npm start`
     - **Plan**: Free
   - Environment Variables:
     ```
     NODE_ENV=production
     PORT=10000
     DATABASE_URL=<paste-internal-database-url>
     JWT_SECRET=<generate-random-secret>
     JWT_EXPIRES_IN=7d
     FRONTEND_URL=https://your-frontend-name.onrender.com
     ```
   - Click "Create Web Service"
   - **Wait for deployment** (5-10 minutes)
   - **Copy your backend URL**

4. **Run Database Migrations**
   - In your backend service, click "Shell" tab
   - Run:
     ```bash
     cd backend
     npx prisma migrate deploy
     npx tsx prisma/seed.ts
     ```

5. **Deploy Frontend**
   - Click "New +" → "Static Site"
   - Connect your GitHub repo
   - Settings:
     - **Name**: `zoho-invoice-frontend`
     - **Root Directory**: Leave empty
     - **Build Command**: `cd frontend && npm install && npm run build`
     - **Publish Directory**: `frontend/dist`
   - Environment Variable:
     ```
     VITE_API_URL=https://your-backend-url.onrender.com/api
     ```
   - Click "Create Static Site"
   - **Copy your frontend URL**

6. **Update CORS**
   - Go back to backend service
   - Update `FRONTEND_URL` environment variable to your frontend URL
   - Click "Save Changes" (will auto-redeploy)

7. **Done!** 🎉
   - Visit your frontend URL
   - Login with: `admin@example.com` / `admin123`
   - **Change the password immediately!**

---

## 🔑 Generate JWT Secret

Run this command to generate a secure secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Or on Linux/Mac:
```bash
openssl rand -base64 32
```

---

## ⚠️ Important Notes

1. **Free Tier Limitations:**
   - Render free tier spins down after 15 min inactivity
   - First request after spin-down takes ~30 seconds
   - Consider upgrading for production use

2. **Database:**
   - Free PostgreSQL on Render is sufficient for testing
   - For production, consider managed database services

3. **Environment Variables:**
   - Never commit `.env` files to Git
   - Always use platform's environment variable settings

4. **Security:**
   - Change default admin password immediately
   - Use strong JWT_SECRET
   - Enable HTTPS (automatic on Render)

---

## 🐛 Troubleshooting

**Backend won't start:**
- Check build logs for errors
- Verify DATABASE_URL is correct
- Ensure Prisma Client is generated

**Database connection errors:**
- Use Internal Database URL (not External)
- Check database is running
- Verify connection string format

**CORS errors:**
- Ensure FRONTEND_URL matches exactly (including https://)
- Check backend logs for CORS errors

**Frontend can't connect:**
- Verify VITE_API_URL includes `/api` at the end
- Check browser console for errors
- Verify backend is running

---

## 📚 Full Documentation

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guides on:
- Railway deployment
- Fly.io deployment
- Docker deployment
- Advanced configurations

---

## 🎯 Next Steps

After deployment:
1. ✅ Test all features
2. ✅ Change admin password
3. ✅ Set up backups
4. ✅ Monitor usage
5. ✅ Consider custom domain

Good luck! 🚀


