# SmartMeet UNZA - Complete Setup Guide

This guide will help you set up the SmartMeet UNZA project with a proper SQL database and get everything running.

## 🗂️ Project Structure

```
smartmeet-unza/
├── smartmeet-unza/           # Frontend application
├── smartmeet-unza-backend/   # Backend server with SQL database
│   ├── sql/                  # Database files
│   │   ├── schema.sql        # Database schema
│   │   ├── config.js         # Database configuration
│   │   ├── connection.js     # Database connection
│   │   ├── models.js         # Database models
│   │   └── init-database.js  # Database initialization
│   ├── server.js             # Main server file
│   ├── package.json          # Backend dependencies
│   └── config.env            # Environment configuration
└── README.md                 # Project overview
```

## 🚀 Quick Start (Windows)

### Option 1: Using Setup Script (Recommended)
1. Double-click `smartmeet-unza-backend/setup.bat`
2. Follow the prompts
3. The script will automatically:
   - Check MySQL service
   - Install dependencies
   - Initialize database
   - Start the server

### Option 2: Manual Setup
Follow the detailed steps below.

## 📋 Prerequisites

### 1. Install MySQL Server
- Download MySQL Installer from [mysql.com](https://dev.mysql.com/downloads/installer/)
- Run the installer as Administrator
- Choose "Developer Default" or "Server only"
- Set a root password (remember this!)
- Complete the installation

### 2. Verify MySQL Installation
```bash
# Open Command Prompt as Administrator
mysql --version
```

### 3. Start MySQL Service
```bash
# Method 1: Command Prompt (as Administrator)
net start mysql

# Method 2: Services
# Press Win+R, type "services.msc"
# Find "MySQL" service and start it
```

## 🔧 Database Setup

### 1. Configure Database Connection
Edit `smartmeet-unza-backend/config.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_root_password
DB_NAME=smartmeet_unza
DB_PORT=3306
```

### 2. Install Backend Dependencies
```bash
cd smartmeet-unza-backend
npm install
```

### 3. Initialize Database
```bash
npm run init-db
```

**Expected Output:**
```
🔌 Connected to MySQL server...
📋 Found 15 SQL statements to execute...
✅ Statement 1 executed successfully
✅ Statement 2 executed successfully
...
🎉 Database initialization completed successfully!

📊 Database: smartmeet_unza
👤 Default admin user: admin@unza.zm / admin123
🏢 Default departments and venues created
⚙️  Default settings configured
```

## 🖥️ Start the Application

### 1. Start Backend Server
```bash
cd smartmeet-unza-backend
npm run dev
```

**Expected Output:**
```
🚀 SmartMeet UNZA Backend Server running on port 3001
📱 Frontend served from: [path]
🔗 API available at: http://localhost:3001/api
🌐 Frontend available at: http://localhost:3001
```

### 2. Access the Application
- **Frontend:** http://localhost:3001
- **API:** http://localhost:3001/api
- **Health Check:** http://localhost:3001/api/health

## 🔐 Default Login Credentials

After database initialization, you can log in with:
- **Email:** admin@unza.zm
- **Password:** admin123

## 🗄️ Database Schema

The system creates the following tables:

| Table | Purpose |
|-------|---------|
| `users` | User accounts and profiles |
| `departments` | University departments |
| `venues` | Meeting rooms and locations |
| `meetings` | Meeting information |
| `meeting_participants` | Meeting attendees |
| `bookings` | Room reservations |
| `notifications` | System notifications |
| `documents` | Meeting documents |
| `settings` | System configuration |

## 🛠️ Troubleshooting

### MySQL Connection Issues

**Error: "Access denied for user 'root'@'localhost'"**
```sql
-- Connect to MySQL as root
mysql -u root -p

-- Reset root password if needed
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

**Error: "Can't connect to MySQL server"**
1. Check if MySQL service is running
2. Verify port 3306 is not blocked
3. Check Windows Firewall settings

### Database Initialization Issues

**Error: "ER_DBACCESS_DENIED_ERROR"**
```sql
-- Grant privileges to root user
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;
```

**Error: "ER_TABLE_EXISTS_ERROR"**
- This is normal if tables already exist
- The script will skip existing tables

### Port Conflicts

**Error: "EADDRINUSE"**
- Change port in `config.env`: `PORT=3002`
- Or stop other services using port 3001

## 📱 Frontend Development

The frontend is served statically from the `smartmeet-unza/` directory. To develop the frontend:

1. Make changes to files in `smartmeet-unza/`
2. Refresh the browser at http://localhost:3001
3. The server automatically serves the updated files

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Admin
- `GET /api/admin/users` - Get all users (admin only)

### Meetings
- `POST /api/meetings` - Create meeting
- `GET /api/meetings` - Get meetings
- `GET /api/meetings/:id` - Get specific meeting

### Venues
- `GET /api/venues` - Get all venues
- `POST /api/venues` - Create venue (admin only)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings

## 🚀 Production Deployment

For production deployment:

1. **Change default passwords**
2. **Use strong JWT secrets**
3. **Enable SSL for database connections**
4. **Set up database backups**
5. **Configure environment variables**
6. **Use PM2 or similar process manager**

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify MySQL service is running
3. Check database credentials in `config.env`
4. Review error messages in the console
5. Ensure all dependencies are installed

## 🎯 Next Steps

After successful setup:

1. **Explore the admin dashboard** at http://localhost:3001
2. **Create additional users** through the admin interface
3. **Add more venues** for meeting rooms
4. **Customize system settings** as needed
5. **Develop additional features** for your specific requirements

---

**Happy coding! 🎉**

The SmartMeet UNZA system is now ready with a robust SQL database backend!
