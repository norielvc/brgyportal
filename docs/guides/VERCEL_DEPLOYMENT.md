# Vercel Deployment Guide

## Overview
This project has two parts:
1. **Frontend** (Next.js) → Deploy to Vercel
2. **Backend** (Express.js) → Deploy to Railway, Render, or similar

## Step 1: Deploy Backend First

### Option A: Deploy to Railway (Recommended)
1. Go to [railway.app](https://railway.app) and sign up/login
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository and choose the `backend` folder
4. Add environment variables:
   ```
   PORT=5005
   JWT_SECRET=your-secret-key-here
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
5. Railway will auto-deploy and give you a URL like `https://your-app.railway.app`

### Option B: Deploy to Render
1. Go to [render.com](https://render.com) and sign up/login
2. Click "New" → "Web Service"
3. Connect your GitHub repo
4. Set:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Add environment variables (same as above)
6. Deploy and get your URL

## Step 2: Deploy Frontend to Vercel

### Method 1: Via Vercel Dashboard (Easiest)
1. Go to [vercel.com](https://vercel.com) and sign up/login with GitHub
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Add Environment Variable:
   ```
   NEXT_PUBLIC_API_URL = https://your-backend-url.railway.app
   ```
   (Replace with your actual backend URL from Step 1)
6. Click "Deploy"

### Method 2: Via Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend folder
cd frontend

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? your-project-name
# - Directory? ./
# - Override settings? No

# For production deployment
vercel --prod
```

## Step 3: Configure Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add:
   | Name | Value |
   |------|-------|
   | NEXT_PUBLIC_API_URL | https://your-backend-url.railway.app |

4. Redeploy for changes to take effect

## Step 4: Update Backend CORS

Make sure your backend allows requests from your Vercel domain.

In `backend/server.js`, update CORS:
```javascript
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://your-app.vercel.app',
    'https://your-custom-domain.com'
  ],
  credentials: true
};
app.use(cors(corsOptions));
```

## Troubleshooting

### API calls failing?
- Check that `NEXT_PUBLIC_API_URL` is set correctly in Vercel
- Ensure backend CORS allows your Vercel domain
- Check browser console for errors

### Build failing?
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Run `npm run build` locally to test

### Camera not working on QR Scanner?
- Vercel uses HTTPS by default, which is required for camera access
- Make sure you're accessing via HTTPS

## Custom Domain (Optional)

1. In Vercel dashboard, go to "Settings" → "Domains"
2. Add your custom domain
3. Update DNS records as instructed
4. Update backend CORS to include your custom domain

## Environment Variables Summary

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

### Backend (Railway/Render)
```
PORT=5005
JWT_SECRET=your-super-secret-jwt-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
NODE_ENV=production
```
