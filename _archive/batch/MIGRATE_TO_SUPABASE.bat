@echo off
echo ========================================
echo   COMPANYHUB: MIGRATE TO SUPABASE
echo ========================================
echo.
echo This script will help you migrate from MongoDB to Supabase
echo.
echo Prerequisites:
echo   1. Supabase account (https://supabase.com)
echo   2. Supabase project created
echo   3. Database table created (see SUPABASE_QUICK_START.md)
echo.
pause

echo.
echo Step 1: Update backend/.env
echo ========================================
echo.
echo Open backend/.env and add:
echo   SUPABASE_URL=https://your-project.supabase.co
echo   SUPABASE_ANON_KEY=your-anon-key
echo   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
echo.
echo Press any key when done...
pause

echo.
echo Step 2: Update backend/server.js
echo ========================================
echo.
echo Find this line:
echo   const authRoutes = require('./routes/auth');
echo.
echo Replace with:
echo   const authRoutes = require('./routes/auth-supabase');
echo.
echo Press any key when done...
pause

echo.
echo Step 3: Seed Supabase Database
echo ========================================
echo.
cd backend
node scripts/seedSupabase.js
cd ..

echo.
echo Step 4: Start Backend Server
echo ========================================
echo.
start "CompanyHub Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak > nul

echo.
echo Step 5: Start Frontend Server
echo ========================================
echo.
start "CompanyHub Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 5 /nobreak > nul

echo.
echo ========================================
echo   MIGRATION COMPLETE!
echo ========================================
echo.
echo Your CompanyHub is now running with Supabase!
echo.
echo Access:
echo   Frontend: http://localhost:3002
echo   Backend:  http://localhost:5000/api
echo.
echo Login with:
echo   Email: admin@example.com
echo   Password: admin123
echo.
echo Benefits:
echo   ✅ No CORS errors
echo   ✅ Cloud-hosted database
echo   ✅ Automatic backups
echo   ✅ Built-in authentication
echo   ✅ Easy to deploy
echo.
echo Next Steps:
echo   1. Test login at http://localhost:3002
echo   2. Verify dashboard loads correctly
echo   3. Deploy to production when ready
echo.
pause