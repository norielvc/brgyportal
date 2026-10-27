@echo off
echo ========================================
echo   COMPANYHUB - MANAGEMENT SYSTEM
echo ========================================
echo.
echo Starting professional admin dashboard...
echo.

REM Start backend server
echo [1/2] Starting backend server...
start "Backend Server" cmd /k "cd backend && npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend server  
echo [2/2] Starting frontend server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   DASHBOARD STARTED SUCCESSFULLY!
echo ========================================
echo.
echo Backend API: http://localhost:5005/api (or PORT in backend/.env)
echo Frontend:   http://localhost:3003
echo.
echo Login Credentials:
echo   Admin: admin@example.com / admin123
echo   User:  user@example.com / user123
echo.
echo Press any key to open the dashboard...
pause > nul

REM Open the dashboard in default browser
start http://localhost:3003

echo.
echo Dashboard opened in your browser!
echo Keep this window open to monitor the servers.
echo.
pause