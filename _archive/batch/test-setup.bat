@echo off
echo ========================================
echo  Testing Admin Dashboard Setup
echo ========================================
echo.

echo Starting backend server...
start "Backend Server" cmd /k "cd backend && npm run dev"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo Testing backend API...
curl -s http://localhost:5000/api/health >nul
if %errorlevel% equ 0 (
    echo ✓ Backend API is responding
) else (
    echo ✗ Backend API is not responding
    echo Check the backend server window for errors
)

echo.
echo Starting frontend server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo  Servers are starting...
echo ========================================
echo.
echo Backend: http://localhost:5000/api/health
echo Frontend: http://localhost:3000
echo.
echo Wait about 30 seconds for Next.js to compile,
echo then open http://localhost:3000 in your browser
echo.
echo Press any key to open the dashboard...
pause >nul

start http://localhost:3000

echo.
echo If the page doesn't load:
echo 1. Wait longer for Next.js compilation
echo 2. Check the server windows for errors
echo 3. Run troubleshoot.bat for diagnostics
echo ========================================