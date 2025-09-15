import { readFileSync, unlinkSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'smartmeet.db');
const schemaPath = join(__dirname, 'schema.sql');

// Remove existing database file if it exists
if (existsSync(dbPath)) {
    console.log('Removing existing database file...');
    unlinkSync(dbPath);
}

// Create a new database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error creating database:', err);
        process.exit(1);
    }
    
    console.log('Connected to SQLite database');
    
    // Enable foreign keys
    db.serialize(() => {
        db.run('PRAGMA foreign_keys = ON');
        
        // Read the schema file
        const schema = readFileSync(schemaPath, 'utf8');
        
        // Split the schema into individual statements
        const statements = schema
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);
        
        // Execute each statement
        statements.forEach((stmt, index) => {
            if (stmt) {
                db.run(stmt, (err) => {
                    if (err) {
                        console.error(`Error executing statement ${index + 1}:`, err.message);
                        console.error('Problematic statement:', stmt);
                        process.exit(1);
                    }
                });
            }
        });
        
        // Verify the setup
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
    });
});
