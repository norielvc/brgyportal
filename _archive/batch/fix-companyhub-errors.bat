@echo off
echo ========================================
echo   COMPANYHUB ERROR DIAGNOSIS & FIX
echo ========================================
echo.

echo [1/6] Checking MongoDB Connection...
echo.
node backend/check-users.js
if %errorlevel% neq 0 (
    echo ❌ MongoDB connection failed. Starting MongoDB...
    start "MongoDB" cmd /k ".\start-mongodb.bat"
    timeout /t 5 /nobreak > nul
    echo ✅ MongoDB started. Re-seeding database...
    cd backend
    node scripts/seedDatabase.js
    cd ..
) else (
    echo ✅ MongoDB connection OK
)

echo.
echo [2/6] Checking Backend API...
echo.
curl -s http://localhost:5000/api/health > nul
if %errorlevel% neq 0 (
    echo ❌ Backend not responding. Restarting...
    .\restart-backend.bat
) else (
    echo ✅ Backend API responding
)

echo.
echo [3/6] Checking Frontend Dependencies...
echo.
cd frontend
npm list lucide-react react-hot-toast clsx > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Missing dependencies. Installing...
    npm install lucide-react react-hot-toast clsx js-cookie
) else (
    echo ✅ Frontend dependencies OK
)
cd ..

echo.
echo [4/6] Testing Login Flow...
echo.
node test-frontend-login.js

echo.
echo [5/6] Checking Frontend Access...
echo.
curl -s http://localhost:3002 > nul
if %errorlevel% neq 0 (
    echo ❌ Frontend not accessible
    echo Starting frontend server...
    start "Frontend" cmd /k "cd frontend && npm run dev"
) else (
    echo ✅ Frontend accessible
)

echo.
echo [6/6] Opening Test Page...
echo.
start test-login-flow.html

echo.
echo ========================================
echo   DIAGNOSIS COMPLETE
echo ========================================
echo.
echo CompanyHub Status:
echo - MongoDB:  Check terminal windows
echo - Backend:  http://localhost:5000/api/health
echo - Frontend: http://localhost:3002
echo - Test:     test-login-flow.html (opened)
echo.
echo Login Credentials:
echo   admin@example.com / admin123
echo   user@example.com / user123
echo.
pause