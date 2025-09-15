@echo off
echo ========================================
echo SmartMeet UNZA Database Setup
echo ========================================
echo.

echo Step 1: Checking if MySQL is running...
net start mysql >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ MySQL service is not running!
    echo Please start MySQL service first.
    echo You can do this by:
    echo   1. Opening Services (services.msc)
    echo   2. Finding MySQL service
    echo   3. Right-click and select "Start"
    echo.
    pause
    exit /b 1
)
echo ✅ MySQL service is running.

echo.
echo Step 2: Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies!
    pause
    exit /b 1
)
echo ✅ Dependencies installed successfully.

echo.
echo Step 3: Initializing database...
call npm run init-db
if %errorlevel% neq 0 (
    echo ❌ Database initialization failed!
    echo Please check your MySQL credentials in config.env
    pause
    exit /b 1
)
echo ✅ Database initialized successfully.

echo.
echo Step 4: Starting the server...
echo 🚀 Starting SmartMeet UNZA Backend Server...
echo 📱 Frontend will be available at: http://localhost:3001
echo 🔗 API will be available at: http://localhost:3001/api
echo.
echo Press Ctrl+C to stop the server
echo.
call npm run dev
