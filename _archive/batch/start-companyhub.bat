@echo off
echo ========================================
echo   COMPANYHUB - COMPLETE STARTUP
echo ========================================
echo.

echo [1/4] Starting MongoDB Server...
start "MongoDB Server" cmd /k ".\start-mongodb.bat"
timeout /t 3 /nobreak > nul

echo [2/4] Starting Backend API Server...
start "CompanyHub Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak > nul

echo [3/4] Starting Frontend Server...
start "CompanyHub Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 5 /nobreak > nul

echo [4/4] Opening Dashboard...
timeout /t 2 /nobreak > nul

echo.
echo ========================================
echo   COMPANYHUB IS NOW RUNNING!
echo ========================================
echo.
echo MongoDB:     Running on port 27017
echo Backend API: http://localhost:5000/api
echo Frontend:    http://localhost:3002 (auto-detected port)
echo.
echo Login Credentials:
echo   Admin: admin@example.com / admin123
echo   User:  user@example.com / user123
echo.
echo Opening dashboard in your browser...
start http://localhost:3002

echo.
echo All services are running in separate windows.
echo Close this window when you're done.
echo.
pause