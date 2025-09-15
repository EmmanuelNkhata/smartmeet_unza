const mysql = require('mysql2/promise');
require('dotenv').config();

// Database connection configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '2021541703Slim',
    database: process.env.DB_NAME || 'smartmeet',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
};

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Test the database connection
async function testConnection() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('✅ Successfully connected to MySQL database');
        return true;
    } catch (error) {
        console.error('❌ Error connecting to database:', error.message);
        return false;
    } finally {
        if (connection) connection.release();
    }
}

// Database methods
async function query(sql, params = []) {
    try {
        const [rows] = await pool.query(sql, params);
        return rows;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

async function getOne(sql, params = []) {
    try {
        const [rows] = await pool.query(sql, params);
        return rows[0] || null;
    } catch (error) {
        console.error('Database get error:', error);
        throw error;
    }
}

async function run(sql, params = []) {
    try {
        const [result] = await pool.query(sql, params);
        return { 
            id: result.insertId, 
            changes: result.affectedRows 
        };
    } catch (error) {
        console.error('Database run error:', error);
        throw error;
    }
}

// Transaction helper
async function transaction(callback) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const txnDb = {
            query: (sql, params) => connection.query(sql, params),
            getOne: async (sql, params) => {
                const [rows] = await connection.query(sql, params);
                return rows[0] || null;
            },
            run: async (sql, params) => {
                const [result] = await connection.query(sql, params);
                return { 
                    id: result.insertId, 
                    changes: result.affectedRows 
                };
            }
        };

        const result = await callback(txnDb);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = {
    pool,
    query,
    getOne,
    run,
    transaction,
    testConnection,
    escape: mysql.escape
};
