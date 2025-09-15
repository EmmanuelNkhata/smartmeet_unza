@echo off
echo Initializing SmartMeet UNZA Database...
echo ===================================

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is available
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: npm is not available.
    echo Please ensure Node.js is installed correctly.
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
call npm install --silent

if %ERRORLEVEL% neq 0 (
    echo Error: Failed to install dependencies.
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)

echo.
echo Creating database...
call node init-db.js

if %ERRORLEVEL% neq 0 (
    echo.
    echo Error: Failed to initialize database.
    pause
    exit /b 1
)

echo.
echo ===================================
echo Database initialization complete!
echo You can now start using SmartMeet UNZA.
echo.
pause
