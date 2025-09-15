const { testConnection, query } = require('./api/config/db-new');

async function testDatabase() {
    try {
        console.log('🔍 Testing database connection...');
        const isConnected = await testConnection();
        
        if (!isConnected) {
            console.error('❌ Failed to connect to database');
            return;
        }

        console.log('✅ Database connection successful!');
        
        // Test a simple query
        const rows = await query('SHOW TABLES');
        console.log(`\n📋 Found ${rows.length} tables in the database`);
        
        if (rows.length > 0) {
            console.log('\nTables:');
            rows.forEach((row, index) => {
                console.log(`${index + 1}. ${Object.values(row)[0]}`);
            });
            
            // Test users table
            try {
                const users = await query('SELECT * FROM users LIMIT 3');
                console.log('\n👤 Sample users:');
                users.forEach(user => {
                    console.log(`- ${user.email} (${user.role || 'no role'})`);
                });
            } catch (error) {
                console.log('\nℹ️ No users table or error fetching users:', error.message);
            }
        } else {
            console.log('\nℹ️ No tables found in the database');
            console.log('\nWould you like to create the database schema? (y/n)');
            // We'll handle the schema creation in the next step
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit();
    }
}

// Run the test
testDatabase();
