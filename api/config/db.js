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

// Database methods
const query = async (sql, params = []) => {
    try {
        const [rows] = await pool.query(sql, params);
        return rows;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};

const get = async (sql, params = []) => {
    try {
        const [rows] = await pool.query(sql, params);
        return rows[0] || null;
    } catch (error) {
        console.error('Database get error:', error);
        throw error;
    }
};

const run = async (sql, params = []) => {
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
};

// Transaction helper
const transaction = async (callback) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        // Create a new db object with connection-specific methods
        const txnDb = {
            query: (sql, params) => connection.query(sql, params),
            get: async (sql, params) => {
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

        // Execute the callback with the transaction db
        const result = await callback(txnDb);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};
            resolve(rows);
        });
    });
};

const get = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
};

const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) return reject(err);
            resolve({ id: this.lastID, changes: this.changes });
        });
    });
};

// Transaction helper
const transaction = async (operations) => {
    try {
        await run('BEGIN TRANSACTION');
        const result = await operations();
        await run('COMMIT');
        return result;
    } catch (error) {
        await run('ROLLBACK');
        throw error;
    }
};

module.exports = {
    pool,
    query,
    get,
    run,
    transaction,
    escape: mysql.escape
};
