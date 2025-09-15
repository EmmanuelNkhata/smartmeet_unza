import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '2021541703Slim',
    database: process.env.DB_NAME || 'smartmeet',
    multipleStatements: true
};

const schemaPath = join(__dirname, 'schema.sql');

async function resetDatabase() {
    let connection;
    
    try {
        // Create a connection to MySQL server (without specifying a database)
        const tempConfig = { ...dbConfig };
        delete tempConfig.database;
        
        connection = await mysql.createConnection(tempConfig);
        
        // Drop and recreate the database
        console.log('Dropping existing database...');
        await connection.query(`DROP DATABASE IF EXISTS \`${dbConfig.database}\``);
        await connection.query(`CREATE DATABASE \`${dbConfig.database}\``);
        
        console.log(`Database '${dbConfig.database}' has been reset.`);
        
        // Close the connection and reconnect to the specific database
        await connection.end();
        
        // Reconnect to the specific database
        connection = await mysql.createConnection(dbConfig);
        
        // Read and execute the schema
        console.log('Creating tables...');
        const schema = readFileSync(schemaPath, 'utf8');
        
        // Split the schema into individual statements
        const statements = schema
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);
        
        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            if (stmt) {
                try {
                    await connection.query(stmt);
                    console.log(`✓ Executed statement ${i + 1}/${statements.length}`);
                } catch (err) {
                    console.error(`Error executing statement ${i + 1}/${statements.length}:`, err.message);
                    console.error('Problematic statement:', stmt);
                    throw err;
                }
            }
        }
        
        console.log('\nDatabase schema created successfully!');
        
        // Run the setup script to add sample data
        console.log('\nAdding sample data...');
        const { setupDatabase } = await import('./setup-db.js');
        await setupDatabase(connection);
        
        console.log('\nDatabase reset and setup complete!');
        
    } catch (error) {
        console.error('Error resetting database:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the reset
resetDatabase().catch(error => {
    console.error('Failed to reset database:', error);
    process.exit(1);
});
