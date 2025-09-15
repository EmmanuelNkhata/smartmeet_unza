const mysql = require('mysql2/promise');
const dbConfig = require('./config');

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully!');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Get connection from pool
async function getConnection() {
  try {
    return await pool.getConnection();
  } catch (error) {
    console.error('Error getting database connection:', error);
    throw error;
  }
}

// Execute query with parameters
async function executeQuery(sql, params = []) {
  let connection;
  try {
    connection = await pool.getConnection();
    // Use query() instead of execute() for better compatibility
    const [rows] = await connection.query(sql, params);
    return rows;
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Execute transaction
async function executeTransaction(queries) {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const results = [];
    for (const query of queries) {
      const [rows] = await connection.query(query.sql, query.params || []);
      results.push(rows);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Transaction error:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Close pool
async function closePool() {
  try {
    await pool.end();
    console.log('Database pool closed successfully');
  } catch (error) {
    console.error('Error closing database pool:', error);
  }
}

module.exports = {
  pool,
  testConnection,
  getConnection,
  executeQuery,
  executeTransaction,
  closePool
};
