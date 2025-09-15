const { query, getOne, pool } = require('./api/config/db');

async function testDatabase() {
    try {
        console.log('🔍 Testing database connection...');
        
        // Test connection
        const [rows] = await pool.query('SELECT 1 as test');
        console.log('✅ Database connection successful!');
        
        // Check if tables exist
        console.log('\n📊 Checking database tables...');
        const [tables] = await pool.query('SHOW TABLES');
        console.log(`Found ${tables.length} tables`);
        
        if (tables.length === 0) {
            console.log('No tables found. Creating sample data...');
            await createSampleData();
        } else {
            console.log('\n📋 Existing tables:');
            console.log(tables.map(t => Object.values(t)[0]).join(', '));
            
            // Count users
            const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
            console.log(`\n👥 Total users: ${users[0].count}`);
            
            // Show sample users
            const [sampleUsers] = await pool.query('SELECT user_id, email, role FROM users LIMIT 3');
            console.log('\n👤 Sample users:');
            sampleUsers.forEach(user => {
                console.log(`- ${user.email} (${user.role})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        // Close the connection pool
        await pool.end();
        process.exit();
    }
}

async function createSampleData() {
    try {
        console.log('\n📝 Creating sample data...');
        
        // Create sample user
        const [result] = await pool.query(`
            INSERT INTO users (user_id, email, password_hash, first_name, last_name, role)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            'user001',
            'test@cs.unza.zm',
            '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
            'Test',
            'User',
            'student'
        ]);
        
        console.log('✅ Created test user: test@cs.unza.zm (password: password)');
        
    } catch (error) {
        console.error('Error creating sample data:', error.message);
        throw error;
    }
}

// Run the test
testDatabase();
