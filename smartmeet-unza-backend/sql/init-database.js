const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../config.env') });

const dbConfig = require('./config');

async function initializeDatabase() {
  let connection;
  
  try {
    // Connect without database first
    const { database, ...connectionConfig } = dbConfig;
    connection = await mysql.createConnection(connectionConfig);
    
    console.log('🔌 Connected to MySQL server...');

    // Ensure database exists and select it
    const dbName = dbConfig.database || 'smartmeet_unza';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.changeUser({ database: dbName });
    console.log(`🗃️  Using database: ${dbName}`);
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    // Split schema into individual statements, handling multi-line statements properly
    const statements = [];
    const lines = schema.split('\n');
    let currentStatement = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip comments and empty lines
      if (trimmedLine.startsWith('--') || trimmedLine === '') {
        continue;
      }
      
      // Skip CREATE DATABASE and USE statements (already handled)
      if (/^CREATE\s+DATABASE/i.test(trimmedLine) || /^USE\s+/i.test(trimmedLine)) {
        continue;
      }
      
      currentStatement += trimmedLine + ' ';
      
      // If line ends with semicolon, we have a complete statement
      if (trimmedLine.endsWith(';')) {
        const statement = currentStatement.trim().slice(0, -1); // Remove trailing semicolon
        if (statement.length > 10) {
          statements.push(statement);
        }
        currentStatement = '';
      }
    }
    
    console.log(`📋 Found ${statements.length} SQL statements to execute...`);
    
    // Execute each statement using query() (not execute) to allow DDL
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await connection.query(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          if (error.code === 'ER_DUP_ENTRY' || error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log(`⚠️  Statement ${i + 1} skipped (already exists)`);
          } else {
            console.error(`❌ Error executing statement ${i + 1}:`, error.message);
            throw error;
          }
        }
      }
    }
    
    console.log('🎉 Database initialization completed successfully!');
    console.log(`\n📊 Database: ${dbName}`);
    console.log('👤 Default admin user: admin@unza.zm / 123456789');
    console.log('🏢 Default departments and venues created');
    console.log('⚙️  Default settings configured');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
