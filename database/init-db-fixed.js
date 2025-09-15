import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'smartmeet.db');
const schemaPath = join(__dirname, 'schema.sql');

// Create a new database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error creating database:', err);
        process.exit(1);
    }
    console.log('Connected to SQLite database');
    
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
    
    // Read the schema file
    const schema = readFileSync(schemaPath, 'utf8');
    
    // Split the schema into individual statements
    const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
    
    // Execute each statement sequentially
    const executeStatements = async (index = 0) => {
        if (index >= statements.length) {
            console.log('Database schema created successfully!');
            verifyDatabase();
            return;
        }
        
        const stmt = statements[index];
        
        try {
            await new Promise((resolve, reject) => {
                db.run(stmt, (err) => {
                    if (err) {
                        // Ignore "already exists" errors for indexes and tables
                        if (err.message.includes('already exists') && 
                            (stmt.trim().toUpperCase().startsWith('CREATE INDEX') || 
                             stmt.trim().toUpperCase().startsWith('CREATE TABLE'))) {
                            console.log(`Skipping (already exists): ${stmt.split(' ').slice(0, 3).join(' ')}...`);
                            resolve();
                        } else {
                            console.error(`Error executing statement ${index + 1}:`, err.message);
                            console.error('Problematic statement:', stmt);
                            reject(err);
                        }
                    } else {
                        resolve();
                    }
                });
            });
            
            // Process next statement
            executeStatements(index + 1);
        } catch (err) {
            db.close();
            process.exit(1);
        }
    };
    
    // Start executing statements
    executeStatements();
});

// Function to verify the database setup
function verifyDatabase() {
    console.log('\nVerifying database setup...');
    
    // Check if tables were created
    db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", [], (err, tables) => {
        if (err) {
            console.error('Error verifying tables:', err.message);
            db.close();
            return;
        }
        
        console.log('\nTables created:');
        tables.forEach(table => console.log(`- ${table.name}`));
        
        // Verify the admin user
        db.get("SELECT user_id, email, role FROM users WHERE email = 'admin@cs.unza.zm'", [], (err, user) => {
            if (err) {
                console.error('Error verifying admin user:', err.message);
            } else if (user) {
                console.log('\nAdmin user created successfully:');
                console.log(`- ID: ${user.user_id}`);
                console.log(`- Email: ${user.email}`);
                console.log(`- Role: ${user.role}`);
                console.log('\nDefault password: admin123');
            } else {
                console.log('\nWarning: Admin user not found!');
            }
            
            console.log(`\nDatabase file: ${dbPath}`);
            console.log('\nDatabase initialization complete!');
            
            // Close the database connection
            db.close();
        });
    });
}
