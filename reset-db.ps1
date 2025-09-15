# Reset the database with a default admin user
$ErrorActionPreference = "Stop"

# Create data directory if it doesn't exist
$dataDir = ".\smartmeet-unza-backend\data"
if (-not (Test-Path -Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir | Out-Null
}

# Create a default admin user with hashed password
$adminUser = @{
    id = [guid]::NewGuid().ToString()
    name = "System Administrator"
    email = "admin@unza.zm"
    passwordHash = "$2b$10$1Xp7gY5Jvz2KjXhL8VWXmO1Xp7gY5Jvz2KjXhL8VWXmO1Xp7gY5Jvz2K"
    role = "admin"
    department = "Administration"
    position = "System Administrator"
    phone = ""
    avatar = ""
    isActive = $true
    firstLogin = $false
    lastLogin = $null
    createdAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    updatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
}

# Create default database structure
$db = @{
    users = @($adminUser)
    meetings = @()
    venues = @(
        @{
            id = [guid]::NewGuid().ToString()
            name = "Main Conference Room"
            location = "Main Building, 1st Floor"
            capacity = 20
            description = "Main conference room with projector and video conferencing"
            amenities = @("projector", "video_conferencing", "whiteboard")
            isActive = $true
            createdAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        },
        @{
            id = [guid]::NewGuid().ToString()
            name = "Small Meeting Room"
            location = "ICT Building, Ground Floor"
            capacity = 8
            description = "Small meeting room for team discussions"
            amenities = @("tv", "whiteboard")
            isActive = $true
            createdAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        }
    )
    bookings = @()
    notifications = @()
    documents = @()
    departments = @(
        @{ id = [guid]::NewGuid().ToString(); name = "Computer Science"; code = "CS"; isActive = $true },
        @{ id = [guid]::NewGuid().ToString(); name = "Information Technology"; code = "IT"; isActive = $true },
        @{ id = [guid]::NewGuid().ToString(); name = "Engineering"; code = "ENG"; isActive = $true },
        @{ id = [guid]::NewGuid().ToString(); name = "Business"; code = "BUS"; isActive = $true }
    )
    settings = @{
        bookingWindow = 30
        maxMeetingDuration = 240
        minMeetingNotice = 30
        workingHours = @{
            start = "08:00"
            end = "17:00"
            days = @(1, 2, 3, 4, 5)
        }
        emailNotifications = $true
        smsNotifications = $false
        maintenanceMode = $false
    }
    _migrated = $true
}

# Convert to JSON and save to file
$dbJson = $db | ConvertTo-Json -Depth 10
$dbFile = "$dataDir\db.json"
[System.IO.File]::WriteAllText($dbFile, $dbJson)

Write-Host "✅ Database reset successfully!" -ForegroundColor Green
Write-Host "Admin credentials:" -ForegroundColor Cyan
Write-Host "Email: admin@unza.zm" -ForegroundColor Yellow
Write-Host "Password: admin123" -ForegroundColor Yellow
Write-Host ""
Write-Host "You can now start the server using: node server.js" -ForegroundColor Green
