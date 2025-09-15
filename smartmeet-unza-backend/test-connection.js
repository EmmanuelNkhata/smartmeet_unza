const mysql = require('mysql2/promise');

// Common default passwords to try
const commonPasswords = [
  '',           // No password
  'root',      // Common default
  'password',  // Common default
  'admin',     // Common default
  '123456',    // Common default
  'mysql',     // Common default
  'root123',   // Common default
  'admin123'   // Common default
];

async function testConnection(password) {
  const config = {
    host: 'localhost',
    user: 'root',
    password: password,
    port: 3306,
    charset: 'utf8mb4',
    timezone: '+00:00',
    connectionLimit: 10,
    multipleStatements: true
  };

  try {
    console.log(`\n🔍 Testing connection with password: "${password}"`);
    const connection = await mysql.createConnection(config);
    console.log(`✅ SUCCESS! Connected with password: "${password}"`);
    
    // Test if we can create the database
    try {
      await connection.execute('CREATE DATABASE IF NOT EXISTS smartmeet_unza');
      console.log('✅ Database "smartmeet_unza" created/verified successfully!');
    } catch (dbError) {
      console.log('⚠️  Database creation failed:', dbError.message);
    }
    
    await connection.end();
    return password;
  } catch (error) {
    console.log(`❌ Failed with password: "${password}" - ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🔍 Testing MySQL connection with SQL Benchmark...');
  console.log('================================================');
  
  // First try without database name (just connection)
  for (const password of commonPasswords) {
    const result = await testConnection(password);
    if (result) {
      console.log('\n🎉 SUCCESS! Found working password!');
      console.log(`\n📝 Update your config.env file with:`);
      console.log(`DB_PASSWORD=${result}`);
      console.log('\n🚀 Then run: npm run init-db');
      return;
    }
  }
  
  console.log('\n❌ None of the common passwords worked.');
  console.log('\n💡 Please check:');
  console.log('1. Is SQL Benchmark running?');
  console.log('2. What password did you set during installation?');
  console.log('3. Try connecting through SQL Benchmark interface first');
  console.log('\n📝 Once you find the password, update config.env and run: npm run init-db');
}

main().catch(console.error);
