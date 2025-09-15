import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
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

// Schema file path
const schemaPath = path.join(__dirname, 'schema.sql');

// Create and initialize the database
async function initializeDatabase() {
    let connection;
    
    try {
        // Create a connection to MySQL server (without specifying a database)
        const tempConfig = { ...dbConfig };
        delete tempConfig.database;
        
        connection = await mysql.createConnection(tempConfig);
        
        // Create the database if it doesn't exist
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
        console.log(`Database '${dbConfig.database}' created or already exists.`);
        
        // Switch to the database
        await connection.query(`USE \`${dbConfig.database}\`;`);
        
        // Read the schema file
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Split the schema into individual statements and execute them
        const statements = schema
            .split(';')
            .map(statement => statement.trim())
            .filter(statement => statement.length > 0);
        
        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement) {
                try {
                    await connection.query(statement);
                } catch (err) {
                    console.error(`Error executing statement ${i + 1}:`, err.message);
                    console.error('Problematic statement:', statement);
                    process.exit(1);
                }
            }
        }
        
        console.log('Database schema created successfully!');
        
        // Verify the setup
        await verifyDatabase(connection);
        
        console.log('Database initialization complete!');
    } catch (err) {
        console.error('Error initializing database:', err);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Function to verify the database setup
async function verifyDatabase(connection) {
    console.log('\nVerifying database setup...');
    
    try {
        // Check if tables were created
        const [tables] = await connection.query("SHOW TABLES;");
        
        console.log('\nTables created:');
        const tableNames = tables.map(row => Object.values(row)[0]);
        tableNames.forEach(table => console.log(`- ${table}`));
        
        // Verify the admin user
        const [users] = await connection.query("SELECT user_id, email, role FROM users WHERE email = 'admin@cs.unza.zm'");
        const user = users[0];
        
        if (user) {
            console.log('\nAdmin user created successfully:');
            console.log(`- ID: ${user.user_id}`);
            console.log(`- Email: ${user.email}`);
            console.log(`- Role: ${user.role}`);
            console.log('\nDefault password: admin123');
        } else {
            console.log('\nWarning: Admin user not found!');
        }
        
        console.log(`\nMySQL Database: ${dbConfig.database}`);
    } catch (err) {
        console.error('Error during verification:', err);
        throw err;
    }
}

// Run the initialization
initializeDatabase().catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});
