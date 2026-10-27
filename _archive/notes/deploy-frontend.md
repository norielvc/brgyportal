# Frontend Deployment to Vercel

## 1. Prepare Frontend for Deployment

### Update vercel.json (already exists):
The current vercel.json looks good for deployment.

### Environment Variables for Vercel:
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
NEXT_PUBLIC_APP_NAME=Admin Dashboard
NEXT_PUBLIC_APP_VERSION=1.0.0
NODE_ENV=production
```

## 2. Deploy Steps:

### Method A: Via Vercel Dashboard (Easiest)
1. Go to https://vercel.com
2. Sign up/login with GitHub
3. Click "Add New" → "Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
6. Add environment variables (see above)
7. Click "Deploy"

### Method B: Via Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend folder
cd frontend

# Login and deploy
vercel login
vercel

# For production
vercel --prod
```

Vercel will give you a URL like: `https://your-app.vercel.app`