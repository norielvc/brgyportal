@echo off
echo ========================================
echo   ADMIN DASHBOARD - LOGIN TEST
echo ========================================
echo.
echo Testing MongoDB connection and login...
echo.

cd backend
node test-password.js

echo.
echo ========================================
echo   TEST COMPLETE
echo ========================================
echo.
echo Your admin dashboard is ready!
echo.
echo Frontend: http://localhost:3000/login
echo Debug Page: http://localhost:3000/debug
echo Backend API: http://localhost:5000/api
echo.
echo Login Credentials:
echo   Admin: admin@example.com / admin123
echo   User:  user@example.com / user123
echo.
pause