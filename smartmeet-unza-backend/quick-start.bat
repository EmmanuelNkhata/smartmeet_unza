@echo off
echo ========================================
echo SmartMeet UNZA - Quick Start Script
echo ========================================
echo.

echo Checking if MySQL is accessible...
echo.

echo Step 1: Initializing Database...
echo Running: npm run init-db
npm run init-db

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Database initialized successfully!
    echo.
    echo Step 2: Starting Development Server...
    echo Running: npm run dev
    echo.
    echo 🚀 Server will start on http://localhost:3001
    echo 📱 Frontend will be available at http://localhost:3000
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    npm run dev
) else (
    echo.
    echo ❌ Database initialization failed!
    echo.
    echo Please make sure:
    echo 1. MySQL server is running
    echo 2. MySQL credentials in config.env are correct
    echo 3. MySQL server is accessible on localhost:3306
    echo.
    echo For help, see SETUP-STATUS.md
    echo.
    pause
)
