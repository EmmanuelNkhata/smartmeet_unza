# SmartMeet UNZA SQL Database

This directory contains the SQL database setup for the SmartMeet UNZA system.

## Files

- `schema.sql` - Complete database schema with tables and initial data
- `config.js` - Database connection configuration
- `connection.js` - Database connection pool and utility functions
- `models.js` - Database models with CRUD operations
- `init-database.js` - Database initialization script

## Prerequisites

1. **MySQL Server** (version 5.7+ or MariaDB 10.2+)
2. **Node.js** (version 14+)
3. **MySQL user** with CREATE, INSERT, UPDATE, DELETE privileges

## Setup Instructions

### 1. Install MySQL Server

**Windows:**
- Download MySQL Installer from [mysql.com](https://dev.mysql.com/downloads/installer/)
- Run the installer and follow the setup wizard
- Remember the root password you set

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 2. Create Database User (Optional but Recommended)

```sql
CREATE USER 'smartmeet'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON smartmeet_unza.* TO 'smartmeet'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Install Dependencies

```bash
cd smartmeet-unza-backend
npm install
```

### 4. Configure Database Connection

Copy `config.env` to `.env` and update the database settings:

```bash
cp config.env .env
```

Edit `.env` file with your database credentials:

```env
DB_HOST=localhost
DB_USER=root          # or your custom user
DB_PASSWORD=your_password
DB_NAME=smartmeet_unza
DB_PORT=3306
```

### 5. Initialize Database

Run the database initialization script:

```bash
npm run init-db
```

This will:
- Create the `smartmeet_unza` database
- Create all necessary tables
- Insert default data (departments, venues, admin user)
- Set up initial system settings

### 6. Verify Setup

Check that the database was created successfully:

```sql
USE smartmeet_unza;
SHOW TABLES;
SELECT * FROM users WHERE role = 'admin';
```

## Default Admin User

After initialization, you can log in with:

- **Email:** admin@unza.zm
- **Password:** admin123

## Database Schema

### Tables

1. **users** - User accounts and profiles
2. **departments** - University departments
3. **venues** - Meeting rooms and locations
4. **meetings** - Meeting information
5. **meeting_participants** - Meeting attendees
6. **bookings** - Room reservations
7. **notifications** - System notifications
8. **documents** - Meeting documents
9. **settings** - System configuration

### Key Features

- **UUID-based IDs** for security
- **Foreign key constraints** for data integrity
- **Indexes** for performance optimization
- **JSON fields** for flexible data storage
- **Timestamps** for audit trails

## Troubleshooting

### Connection Issues

1. **Check MySQL service is running:**
   ```bash
   # Windows
   net start mysql
   
   # macOS/Linux
   sudo systemctl status mysql
   ```

2. **Verify credentials in .env file**

3. **Check MySQL user privileges:**
   ```sql
   SHOW GRANTS FOR 'your_user'@'localhost';
   ```

### Permission Issues

If you get permission errors:

```sql
GRANT ALL PRIVILEGES ON smartmeet_unza.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

### Port Conflicts

If port 3306 is in use, change it in the `.env` file and restart MySQL.

## Development

### Adding New Tables

1. Add table creation SQL to `schema.sql`
2. Create corresponding model in `models.js`
3. Update the initialization script if needed

### Database Migrations

For production deployments, consider using a migration tool like:
- `db-migrate`
- `sequelize-cli`
- `knex`

## Production Considerations

1. **Change default passwords**
2. **Use strong JWT secrets**
3. **Enable SSL for database connections**
4. **Set up database backups**
5. **Configure connection pooling**
6. **Monitor database performance**
