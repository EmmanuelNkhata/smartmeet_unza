// Database configuration for SmartMeet UNZA
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smartmeet_unza',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4',
  timezone: '+00:00',
  connectionLimit: 10,
  multipleStatements: true
};

module.exports = dbConfig;
