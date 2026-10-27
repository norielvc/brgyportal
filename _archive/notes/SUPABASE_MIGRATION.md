# CompanyHub: MongoDB to Supabase Migration Guide

## Why Supabase?

✅ **Cloud-hosted** - No local database setup needed  
✅ **Built-in Auth** - JWT, OAuth, email verification  
✅ **PostgreSQL** - Reliable, structured database  
✅ **No CORS Issues** - Managed by Supabase  
✅ **Real-time** - WebSocket support  
✅ **Free Tier** - Perfect for development  
✅ **Easy Deployment** - Works with any cloud provider  

---

## Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with email or GitHub
4. Create a new project:
   - **Name**: companyhub
   - **Password**: Create a strong password
   - **Region**: Choose closest to you
5. Wait for initialization (2-3 minutes)

---

## Step 2: Get Your Credentials

1. Go to **Settings → API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Anon Key** (public key)
   - **Service Role Key** (secret key - keep safe!)

---

## Step 3: Create Database Tables

1. Go to **SQL Editor** in Supabase
2. Click **New Query**
3. Paste this SQL:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  avatar TEXT,
  last_login TIMESTAMP,
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users are viewable by authenticated users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');
```

4. Click **Run**

---

## Step 4: Update Backend Configuration

1. Copy `.env.supabase` to `.env`:
   ```bash
   cp backend/.env.supabase backend/.env
   ```

2. Edit `backend/.env` and add your Supabase credentials:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   JWT_SECRET=your-secret-key
   JWT_EXPIRE=7d
   PORT=5000
   NODE_ENV=development
   ```

3. Update `backend/server.js` to use Supabase auth:
   ```javascript
   // Replace this line:
   const authRoutes = require('./routes/auth');
   
   // With this:
   const authRoutes = require('./routes/auth-supabase');
   ```

---

## Step 5: Seed the Database

```bash
cd backend
node scripts/seedSupabase.js
```

You should see:
```
✅ Successfully seeded 6 users
📋 Default Login Credentials:
Admin: admin@example.com / admin123
User: user@example.com / user123
```

---

## Step 6: Update Frontend (Optional)

The frontend doesn't need changes! It will work as-is because:
- API endpoints remain the same
- Authentication flow is identical
- Response format is compatible

---

## Step 7: Test Everything

1. Start backend:
   ```bash
   cd backend && npm run dev
   ```

2. Start frontend:
   ```bash
   cd frontend && npm run dev
   ```

3. Open http://localhost:3002
4. Login with: `admin@example.com` / `admin123`

---

## Advantages You'll Notice

✅ **No CORS errors** - Supabase handles this  
✅ **Faster setup** - No local database installation  
✅ **Better security** - Managed infrastructure  
✅ **Easy scaling** - Supabase handles it  
✅ **Real-time updates** - Built-in WebSocket support  
✅ **Automatic backups** - Supabase manages this  

---

## Deployment

When ready to deploy:

1. **Vercel** (Frontend):
   ```bash
   vercel deploy
   ```

2. **Railway/Render** (Backend):
   - Connect your GitHub repo
   - Set environment variables
   - Deploy

3. **Supabase** (Database):
   - Already hosted and managed!

---

## Rollback to MongoDB

If you need to go back:

1. Restore `backend/server.js`:
   ```javascript
   const authRoutes = require('./routes/auth');
   ```

2. Start MongoDB:
   ```bash
   .\start-mongodb.bat
   ```

3. Seed MongoDB:
   ```bash
   cd backend && node scripts/seedDatabase.js
   ```

---

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Community**: https://discord.supabase.io
- **CompanyHub Issues**: Check GitHub issues

---

**Ready to migrate? Let's do it! 🚀**