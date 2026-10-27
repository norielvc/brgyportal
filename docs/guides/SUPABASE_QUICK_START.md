# Supabase Quick Start for CompanyHub

## TL;DR - 5 Minute Setup

### 1. Create Supabase Project
- Go to https://supabase.com
- Sign up → Create project
- Copy **Project URL** and **Service Role Key**

### 2. Create Database Table
In Supabase SQL Editor, run:
```sql
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

CREATE INDEX idx_users_email ON users(email);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### 3. Update Backend .env
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
```

### 4. Update backend/server.js
Change line:
```javascript
const authRoutes = require('./routes/auth');
```
To:
```javascript
const authRoutes = require('./routes/auth-supabase');
```

### 5. Seed Database
```bash
cd backend
node scripts/seedSupabase.js
```

### 6. Start Servers
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### 7. Login
- URL: http://localhost:3002
- Email: admin@example.com
- Password: admin123

---

## Why This Solves Your CORS Issues

**MongoDB Setup:**
- ❌ Local database
- ❌ Manual CORS configuration
- ❌ Complex authentication
- ❌ Requires MongoDB service running

**Supabase Setup:**
- ✅ Cloud-hosted (no local setup)
- ✅ CORS handled automatically
- ✅ Built-in JWT authentication
- ✅ Always available

---

## Files Created

- `backend/.env.supabase` - Configuration template
- `backend/services/supabaseClient.js` - Supabase connection
- `backend/routes/auth-supabase.js` - Authentication routes
- `backend/scripts/seedSupabase.js` - Database seeding
- `SUPABASE_MIGRATION.md` - Detailed migration guide

---

## Next Steps

1. ✅ Create Supabase project
2. ✅ Create database table
3. ✅ Update .env file
4. ✅ Update server.js
5. ✅ Run seed script
6. ✅ Start servers
7. ✅ Test login

**That's it! Your CORS issues are gone.** 🎉

---

## Questions?

- **Supabase Docs**: https://supabase.com/docs
- **Full Migration Guide**: See `SUPABASE_MIGRATION.md`
- **Need MongoDB?**: See rollback instructions in migration guide