# 🚀 Deployment Checklist

## Pre-Deployment Setup

- [ ] Ensure all code is committed to GitHub
- [ ] Frontend builds successfully (`npm run build` in frontend folder)
- [ ] Backend runs without errors locally
- [ ] Supabase database is set up and accessible

## Backend Deployment (Railway)

### 1. Deploy to Railway
- [ ] Go to [railway.app](https://railway.app)
- [ ] Sign up/login with GitHub
- [ ] Click "New Project" → "Deploy from GitHub repo"
- [ ] Select your repository
- [ ] Choose "backend" as root directory

### 2. Environment Variables
Add these in Railway dashboard:
```
NODE_ENV=production
PORT=5005
JWT_SECRET=your-super-secret-jwt-key-change-this
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
FRONTEND_URL=https://your-app.vercel.app
```

### 3. Get Backend URL
- [ ] Copy the Railway deployment URL (e.g., `https://your-app.railway.app`)

## Frontend Deployment (Vercel)

### 1. Deploy to Vercel
- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Sign up/login with GitHub
- [ ] Click "Add New" → "Project"
- [ ] Import your GitHub repository
- [ ] Set **Root Directory** to `frontend`
- [ ] Framework should auto-detect as Next.js

### 2. Environment Variables
Add these in Vercel dashboard:
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
NEXT_PUBLIC_APP_NAME=Admin Dashboard
NODE_ENV=production
```

### 3. Get Frontend URL
- [ ] Copy the Vercel deployment URL (e.g., `https://your-app.vercel.app`)

## Post-Deployment Configuration

### 1. Update Backend CORS
- [ ] Go back to Railway dashboard
- [ ] Update `FRONTEND_URL` environment variable with your actual Vercel URL
- [ ] Redeploy backend

### 2. Update Frontend API URL
- [ ] Go back to Vercel dashboard
- [ ] Update `NEXT_PUBLIC_API_URL` with your actual Railway URL
- [ ] Redeploy frontend

### 3. Test Deployment
- [ ] Visit your Vercel URL
- [ ] Test login functionality
- [ ] Test API endpoints
- [ ] Test QR scanner (requires HTTPS)
- [ ] Check browser console for errors

## Alternative: VPS Deployment

If you prefer deploying to your own server:

### 1. Server Setup
- [ ] Ubuntu/Windows server with Node.js 18+
- [ ] PM2 installed globally
- [ ] Domain name (optional)

### 2. Deploy with PM2
```bash
# Clone repository
git clone your-repo-url
cd your-project

# Install dependencies
npm run install-all

# Build frontend
cd frontend && npm run build && cd ..

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
```

### 3. Environment Variables
Create `.env` files:
- `backend/.env` - Production database and API settings
- `frontend/.env.local` - Production API URL

## Security Checklist

- [ ] Change default JWT secret
- [ ] Use strong Supabase RLS policies
- [ ] Enable HTTPS (automatic with Vercel/Railway)
- [ ] Configure proper CORS origins
- [ ] Set up monitoring and logging

## Troubleshooting

### Common Issues:
1. **CORS errors**: Check FRONTEND_URL in backend matches your Vercel domain
2. **API not found**: Verify NEXT_PUBLIC_API_URL includes `/api` suffix
3. **Build failures**: Check all dependencies are in package.json
4. **Camera not working**: Ensure you're using HTTPS (Vercel provides this automatically)

### Useful Commands:
```bash
# Check deployment logs
# Railway: View in dashboard
# Vercel: View in dashboard or use `vercel logs`

# Redeploy
# Railway: Push to GitHub or redeploy in dashboard
# Vercel: Push to GitHub or use `vercel --prod`
```

## Success Criteria

✅ **Deployment is successful when:**
- [ ] Frontend loads without errors
- [ ] Login/logout works
- [ ] Dashboard displays data
- [ ] QR scanner functions (on HTTPS)
- [ ] All API endpoints respond correctly
- [ ] No console errors in browser

🎉 **Your app is now live and accessible worldwide!**