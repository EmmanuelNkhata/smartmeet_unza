import sqlite3 from 'sqlite3';
const { Database } = sqlite3;
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'smartmeet.db');
const schemaPath = join(__dirname, 'schema.sql');

// Remove existing database file if it exists
try {
    const fs = await import('fs/promises');
    try {
        await fs.unlink(dbPath);
        console.log('Removed existing database file.');
    } catch (err) {
        if (err.code !== 'ENOENT') throw err;
    }
} catch (err) {
    console.error('Error removing existing database:', err);
    process.exit(1);
}

// Create a new database
const db = new Database(dbPath, (err) => {
    if (err) {
        console.error('Error creating database:', err);
        process.exit(1);
    }
    
    console.log('Database created successfully!');
    
    // Read and execute the schema
    const schema = readFileSync(schemaPath, 'utf8');
    
    db.serialize(() => {
        // Enable foreign keys
        db.run("PRAGMA foreign_keys = ON");
        
        // Split the schema into statements and execute them
        const statements = schema.split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);
        
        let completed = 0;
        
        statements.forEach((stmt, index) => {
            db.run(stmt + ';', (err) => {
                if (err) {
                    console.error(`Error executing statement ${index + 1}:`, err.message);
                    console.error('Statement:', stmt);
                    process.exit(1);
                }
                
                completed++;
                if (completed === statements.length) {
                    console.log('Database schema created successfully!');
                    
                    // Verify the admin user was created
                    db.get("SELECT user_id, email, role FROM users WHERE email = 'admin@cs.unza.zm'", (err, user) => {
                        if (err) {
                            console.error('Error verifying admin user:', err);
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
                        process.exit(0);
                    });
                }
            });
        });
    });
});
