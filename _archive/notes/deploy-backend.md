# Backend Deployment to Railway

## 1. Prepare Backend for Deployment

First, let's create a production-ready backend configuration:

### Create railway.json in backend folder:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Environment Variables for Railway:
```
NODE_ENV=production
PORT=5005
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
FRONTEND_URL=https://your-app.vercel.app
```

## 2. Deploy Steps:

1. Go to https://railway.app
2. Sign up/login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Choose "backend" as root directory
6. Add all environment variables above
7. Deploy!

Railway will give you a URL like: `https://your-app.railway.app`