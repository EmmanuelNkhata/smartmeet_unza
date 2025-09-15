# SmartMeet UNZA Database Setup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SmartMeet UNZA Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if MySQL is running
Write-Host "Step 1: Checking if MySQL is running..." -ForegroundColor Yellow
try {
    $mysqlService = Get-Service -Name "mysql*" -ErrorAction SilentlyContinue
    if ($mysqlService -and $mysqlService.Status -eq "Running") {
        Write-Host "✅ MySQL service is running." -ForegroundColor Green
    } else {
        Write-Host "❌ MySQL service is not running!" -ForegroundColor Red
        Write-Host "Please start MySQL service first." -ForegroundColor Red
        Write-Host "You can do this by:" -ForegroundColor Red
        Write-Host "   1. Opening Services (services.msc)" -ForegroundColor Red
        Write-Host "   2. Finding MySQL service" -ForegroundColor Red
        Write-Host "   3. Right-click and select 'Start'" -ForegroundColor Red
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
} catch {
    Write-Host "❌ Could not check MySQL service status!" -ForegroundColor Red
    Write-Host "Please ensure MySQL is installed and running." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Step 2: Installing dependencies..." -ForegroundColor Yellow
try {
    npm install
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed"
    }
    Write-Host "✅ Dependencies installed successfully." -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Step 3: Initializing database..." -ForegroundColor Yellow
try {
    npm run init-db
    if ($LASTEXITCODE -ne 0) {
        throw "Database initialization failed"
    }
    Write-Host "✅ Database initialized successfully." -ForegroundColor Green
} catch {
    Write-Host "❌ Database initialization failed!" -ForegroundColor Red
    Write-Host "Please check your MySQL credentials in config.env" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Step 4: Starting the server..." -ForegroundColor Yellow
Write-Host "🚀 Starting SmartMeet UNZA Backend Server..." -ForegroundColor Green
Write-Host "📱 Frontend will be available at: http://localhost:3001" -ForegroundColor Cyan
Write-Host "🔗 API will be available at: http://localhost:3001/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the development server
npm run dev
