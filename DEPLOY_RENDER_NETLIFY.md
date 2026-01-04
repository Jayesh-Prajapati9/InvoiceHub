# Deploy Backend on Render + Frontend on Netlify

This is a simplified guide for deploying your backend on Render and frontend on Netlify.

## 📋 What You Need

**For Render (Backend):**
- ✅ `render.yaml` (optional, but helpful)
- ✅ `Dockerfile` (optional, Render can auto-detect Node.js)
- ✅ Backend code

**For Netlify (Frontend):**
- ✅ Frontend code
- ✅ `netlify.toml` (optional, but recommended)

**You DON'T need:**
- ❌ `railway.json` (only for Railway)
- ❌ `fly.toml` (only for Fly.io)
- ❌ `docker-compose.yml` (only for local Docker)

---

## 🚀 Step-by-Step Deployment

### Part 1: Deploy Backend on Render

#### Step 1: Push Code to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

#### Step 2: Create PostgreSQL Database on Render
1. Go to [render.com](https://render.com) and sign up/login
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `zoho-invoice-db`
   - **Database**: `zohoinvoice`
   - **User**: `zohoinvoice` (auto-generated)
   - **Region**: Choose closest to you
   - **Plan**: **Free**
4. Click **"Create Database"**
5. Wait for database to be ready
6. Go to **"Info"** tab → Copy the **"Internal Database URL"** (you'll need this)

#### Step 3: Deploy Backend Service
1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `zoho-invoice-backend`
   - **Root Directory**: Leave empty
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install && npm run build && npx prisma generate`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: **Free**
4. Click **"Advanced"** → Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<paste-internal-database-url-from-step-2>
   JWT_SECRET=<generate-random-secret>
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=https://your-app-name.netlify.app
   ```
   **Note**: Update `FRONTEND_URL` after deploying frontend
5. Click **"Create Web Service"**
6. Wait for deployment (5-10 minutes)
7. **Copy your backend URL** (e.g., `https://zoho-invoice-backend.onrender.com`)

#### Step 4: Run Database Migrations
1. In your backend service, click **"Shell"** tab
2. Run these commands:
   ```bash
   cd backend
   npx prisma migrate deploy
   npx tsx prisma/seed.ts
   ```
3. This creates the database tables and seeds the admin user

---

### Part 2: Deploy Frontend on Netlify

#### Step 1: Create Netlify Configuration File
The `netlify.toml` file is already created for you. It tells Netlify how to build your frontend.

#### Step 2: Deploy to Netlify
1. Go to [netlify.com](https://netlify.com) and sign up/login
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your GitHub repository
4. Configure build settings:
   - **Base directory**: Leave empty (or set to `frontend` if Netlify doesn't auto-detect)
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Publish directory**: `frontend/dist`
5. Click **"Show advanced"** → **"New variable"**:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.onrender.com/api`
   - Replace `your-backend-url` with your actual Render backend URL
6. Click **"Deploy site"**
7. Wait for deployment (2-5 minutes)
8. **Copy your frontend URL** (e.g., `https://zoho-invoice.netlify.app`)

#### Step 3: Update Backend CORS
1. Go back to Render dashboard → Your backend service
2. Go to **"Environment"** tab
3. Update `FRONTEND_URL` to your Netlify frontend URL:
   ```
   FRONTEND_URL=https://your-app-name.netlify.app
   ```
4. Click **"Save Changes"** (will auto-redeploy)

---

## 🔑 Generate JWT Secret

Before deploying, generate a secure JWT secret:

**On Linux/Mac:**
```bash
openssl rand -base64 32
```

**Or using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output and use it as your `JWT_SECRET` in Render.

---

## ✅ Post-Deployment Checklist

- [ ] Backend deployed on Render
- [ ] Database created and connected
- [ ] Database migrations run successfully
- [ ] Database seeded with admin user
- [ ] Frontend deployed on Netlify
- [ ] `VITE_API_URL` set correctly in Netlify
- [ ] `FRONTEND_URL` updated in Render
- [ ] Backend health check works: `https://your-backend.onrender.com/health`
- [ ] Frontend can connect to backend
- [ ] Test login with: `admin@example.com` / `admin123`
- [ ] **Change admin password immediately!**

---

## 🐛 Troubleshooting

### Backend Issues

**Build fails:**
- Check build logs in Render
- Verify `package.json` has correct scripts
- Ensure Node.js version is compatible (Render uses Node 18+)

**Database connection errors:**
- Use **Internal Database URL** (not External)
- Verify database is running
- Check DATABASE_URL format

**CORS errors:**
- Ensure `FRONTEND_URL` in Render matches your Netlify URL exactly
- Include `https://` in the URL
- No trailing slash

### Frontend Issues

**Build fails:**
- Check build logs in Netlify
- Verify `VITE_API_URL` is set correctly
- Ensure build command is correct

**Can't connect to backend:**
- Verify `VITE_API_URL` includes `/api` at the end
- Check backend is running (may be spun down on free tier)
- Check browser console for errors
- Verify CORS settings in backend

**API calls fail:**
- First request after Render spin-down takes ~30 seconds
- Check backend logs in Render dashboard
- Verify environment variables are set

---

## 📝 Environment Variables Summary

### Render (Backend)
```
NODE_ENV=production
PORT=10000
DATABASE_URL=<internal-database-url>
JWT_SECRET=<your-generated-secret>
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-app.netlify.app
```

### Netlify (Frontend)
```
VITE_API_URL=https://your-backend.onrender.com/api
```

---

## ⚠️ Important Notes

1. **Free Tier Limitations:**
   - Render free tier spins down after 15 minutes of inactivity
   - First request after spin-down takes ~30 seconds to wake up
   - Netlify free tier is generous and doesn't spin down

2. **Database:**
   - Use **Internal Database URL** for Render services
   - External URL is only for connecting from outside Render

3. **Build Times:**
   - First deployment: 5-10 minutes
   - Subsequent deployments: 2-5 minutes

4. **Custom Domain:**
   - Both Render and Netlify support custom domains
   - May require paid plans for some features

---

## 🎯 Why This Setup?

- **Render**: Great for Node.js backends with PostgreSQL
- **Netlify**: Excellent for static React sites, fast CDN, great free tier
- **Separation**: Backend and frontend can scale independently
- **Free**: Both platforms offer generous free tiers

---

## 🆘 Need Help?

1. Check platform logs (Render → Logs, Netlify → Deploy logs)
2. Verify all environment variables
3. Test backend health endpoint
4. Check browser console for frontend errors

Good luck with your deployment! 🚀


