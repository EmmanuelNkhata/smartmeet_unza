@echo off
echo Setting up SmartMeet UNZA Database...
echo ===================================

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo Installing required packages...
call npm install --global --production windows-build-tools
call npm install sqlite3 sqlite

if %ERRORLEVEL% neq 0 (
    echo.
    echo Error: Failed to install required packages.
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)

echo.
echo Initializing database...
call node init-db.js

if %ERRORLEVEL% neq 0 (
    echo.
    echo Error: Failed to initialize the database.
    pause
    exit /b 1
)

echo.
echo ===================================
echo Database setup completed successfully!
echo.
echo You can now start the API server:
echo   1. Open a new command prompt
echo   2. Navigate to the api directory
echo   3. Run: npm install
echo   4. Run: npm start
echo.
pause
