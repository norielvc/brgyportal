# Supabase Migration Checklist

## Pre-Migration

- [ ] Read `SUPABASE_QUICK_START.md`
- [ ] Read `SUPABASE_MIGRATION.md`
- [ ] Understand the benefits (see `MONGODB_VS_SUPABASE.md`)
- [ ] Have Supabase account ready (https://supabase.com)

## Step 1: Create Supabase Project (5 min)

- [ ] Go to https://supabase.com
- [ ] Sign up with email or GitHub
- [ ] Create new project
  - [ ] Name: `companyhub`
  - [ ] Password: Create strong password
  - [ ] Region: Choose closest to you
- [ ] Wait for initialization (2-3 minutes)
- [ ] Copy **Project URL** from Settings → API
- [ ] Copy **Service Role Key** from Settings → API
- [ ] Copy **Anon Key** from Settings → API

## Step 2: Create Database Table (2 min)

- [ ] Go to **SQL Editor** in Supabase
- [ ] Click **New Query**
- [ ] Copy SQL from `SUPABASE_QUICK_START.md`
- [ ] Click **Run**
- [ ] Verify table created successfully

## Step 3: Update Backend Configuration (2 min)

- [ ] Copy `backend/.env.supabase` to `backend/.env`
  ```bash
  cp backend/.env.supabase backend/.env
  ```
- [ ] Edit `backend/.env`
- [ ] Add your Supabase credentials:
  - [ ] `SUPABASE_URL=https://your-project.supabase.co`
  - [ ] `SUPABASE_ANON_KEY=your-anon-key`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY=your-service-role-key`
- [ ] Keep other settings as-is
- [ ] Save file

## Step 4: Update Backend Routes (1 min)

- [ ] Open `backend/server.js`
- [ ] Find line: `const authRoutes = require('./routes/auth');`
- [ ] Replace with: `const authRoutes = require('./routes/auth-supabase');`
- [ ] Save file

## Step 5: Seed Database (1 min)

- [ ] Open terminal
- [ ] Navigate to backend:
  ```bash
  cd backend
  ```
- [ ] Run seed script:
  ```bash
  node scripts/seedSupabase.js
  ```
- [ ] Verify output:
  - [ ] "✅ Successfully seeded X users"
  - [ ] "Admin: admin@example.com / admin123"
  - [ ] "User: user@example.com / user123"

## Step 6: Start Backend Server (2 min)

- [ ] Open new terminal
- [ ] Navigate to backend:
  ```bash
  cd backend
  ```
- [ ] Start development server:
  ```bash
  npm run dev
  ```
- [ ] Verify output:
  - [ ] "🚀 Server running on port 5000"
  - [ ] "✅ Connected to Supabase"
  - [ ] No errors in console

## Step 7: Start Frontend Server (2 min)

- [ ] Open another new terminal
- [ ] Navigate to frontend:
  ```bash
  cd frontend
  ```
- [ ] Start development server:
  ```bash
  npm run dev
  ```
- [ ] Verify output:
  - [ ] "✓ Ready in X.Xs"
  - [ ] "Local: http://localhost:3002"
  - [ ] No errors in console

## Step 8: Test Login (2 min)

- [ ] Open browser
- [ ] Go to http://localhost:3002
- [ ] Verify login page loads
- [ ] Enter credentials:
  - [ ] Email: `admin@example.com`
  - [ ] Password: `admin123`
- [ ] Click **Sign In**
- [ ] Verify:
  - [ ] ✅ No CORS errors in console
  - [ ] ✅ Login successful
  - [ ] ✅ Redirected to dashboard
  - [ ] ✅ Dashboard loads with data

## Step 9: Verify Dashboard (2 min)

- [ ] Check dashboard displays:
  - [ ] ✅ Metric cards (Total Employees, Active, etc.)
  - [ ] ✅ Employee table with data
  - [ ] ✅ System alerts
  - [ ] ✅ Quick actions
- [ ] Check sidebar navigation:
  - [ ] ✅ Dashboard link
  - [ ] ✅ Employees link
  - [ ] ✅ Settings link
- [ ] Check header:
  - [ ] ✅ Search bar
  - [ ] ✅ Notifications
  - [ ] ✅ User menu

## Step 10: Test Additional Features (3 min)

- [ ] Test logout:
  - [ ] Click user menu
  - [ ] Click **Sign Out**
  - [ ] Verify redirected to login
- [ ] Test login with different user:
  - [ ] Email: `user@example.com`
  - [ ] Password: `user123`
  - [ ] Verify login works
- [ ] Check browser console:
  - [ ] ✅ No CORS errors
  - [ ] ✅ No JavaScript errors
  - [ ] ✅ No warnings

## Post-Migration

- [ ] ✅ All tests passed
- [ ] ✅ No CORS errors
- [ ] ✅ Dashboard fully functional
- [ ] ✅ Authentication working
- [ ] ✅ Database seeded with users

## Optional: Cleanup

- [ ] Delete `backend/.env.supabase` (optional, keep as template)
- [ ] Delete MongoDB local database (optional, keep as backup)
- [ ] Update `.gitignore` to exclude `.env`

## Deployment Preparation

- [ ] Update `backend/.env` for production
- [ ] Update `frontend/.env.local` for production
- [ ] Test with production URLs
- [ ] Set up CI/CD pipeline
- [ ] Deploy to production

## Troubleshooting

If you encounter issues:

1. **CORS errors still appearing?**
   - [ ] Verify `backend/server.js` uses `auth-supabase`
   - [ ] Check `.env` has correct Supabase credentials
   - [ ] Restart backend server

2. **Login fails?**
   - [ ] Verify database table created
   - [ ] Check seed script ran successfully
   - [ ] Verify credentials in Supabase dashboard

3. **Dashboard doesn't load?**
   - [ ] Check browser console for errors
   - [ ] Verify backend is running
   - [ ] Check network tab in DevTools

4. **Need help?**
   - [ ] See `SUPABASE_MIGRATION.md` for detailed guide
   - [ ] Check `MONGODB_VS_SUPABASE.md` for comparison
   - [ ] Visit https://supabase.com/docs

## Success Criteria

✅ **Migration is successful when:**

- [ ] Login page loads without errors
- [ ] Login with admin credentials works
- [ ] Dashboard displays all data
- [ ] No CORS errors in console
- [ ] No JavaScript errors in console
- [ ] Logout works correctly
- [ ] Can login with different user
- [ ] All UI elements render correctly
- [ ] Navigation works
- [ ] Responsive design works on mobile

## Estimated Time

| Step | Time |
|------|------|
| Create Supabase project | 5 min |
| Create database table | 2 min |
| Update configuration | 2 min |
| Update routes | 1 min |
| Seed database | 1 min |
| Start servers | 4 min |
| Test login | 2 min |
| Verify dashboard | 2 min |
| Test features | 3 min |
| **TOTAL** | **~22 minutes** |

---

## Next Steps After Migration

1. **Deploy to Production**
   - [ ] Set up Vercel for frontend
   - [ ] Set up Railway/Render for backend
   - [ ] Update environment variables
   - [ ] Test production deployment

2. **Monitor Performance**
   - [ ] Check Supabase dashboard
   - [ ] Monitor database usage
   - [ ] Check API response times

3. **Scale as Needed**
   - [ ] Upgrade Supabase plan if needed
   - [ ] Add more features
   - [ ] Optimize queries

---

**Congratulations! Your CompanyHub is now running on Supabase!** 🎉

For questions, see the documentation files or visit https://supabase.com/docs