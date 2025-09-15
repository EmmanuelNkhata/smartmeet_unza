import { hash } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export async function setupDatabase(connection) {
    try {
        // Start a transaction
        await connection.beginTransaction();
        
        console.log('Inserting sample data...');
        
        // Generate a hashed password for the admin user
        const hashedPassword = await hash('admin123', 10);
        const adminId = uuidv4();
        const deptId = uuidv4();
        const venueId = uuidv4();
        const meetingId = uuidv4();
        
        // Insert sample department
        await connection.query(
            'INSERT INTO departments (department_id, name, faculty) VALUES (?, ?, ?)',
            [deptId, 'Computer Science', 'Engineering']
        );
        
        // Insert admin user
        await connection.query(
            `INSERT INTO users 
            (user_id, email, password_hash, first_name, last_name, role, department, phone_number, is_active, is_first_login)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                adminId,
                'admin@cs.unza.zm',
                hashedPassword,
                'Admin',
                'User',
                'admin',
                deptId,
                '260977123456',
                true,
                false
            ]
        );
        
        // Insert sample venue
        await connection.query(
            `INSERT INTO venues 
            (venue_id, name, location, capacity, facilities, is_active)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                venueId,
                'Computer Lab 1',
                'CS Building, Ground Floor',
                30,
                JSON.stringify(['Projector', 'Whiteboard', 'Computers']),
                true
            ]
        );
        
        // Insert sample meeting
        const now = new Date();
        const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later
        
        await connection.query(
            `INSERT INTO meetings 
            (meeting_id, title, description, start_time, end_time, venue_id, meeting_type, status, organizer_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                meetingId,
                'Project Kickoff Meeting',
                'Initial meeting to discuss project requirements and timeline',
                startTime,
                endTime,
                venueId,
                'in_person',
                'scheduled',
                adminId
            ]
        );
        
        // Add admin as participant
        await connection.query(
            `INSERT INTO meeting_participants 
            (meeting_id, user_id, status, attended)
            VALUES (?, ?, ?, ?)`,
            [meetingId, adminId, 'accepted', false]
        );
        
        // Commit the transaction
        await connection.commit();
        console.log('Sample data inserted successfully!');
        
    } catch (error) {
        // Rollback in case of error
        if (connection) {
            await connection.rollback();
        }
        console.error('Error setting up sample data:', error);
        throw error;
    }
}

// If this file is run directly (not imported), create a connection and run the setup
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    import('dotenv/config')
        .then(() => import('mysql2/promise'))
        .then(mysql => {
            const connection = mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '2021541703Slim',
                database: process.env.DB_NAME || 'smartmeet',
                multipleStatements: true
            });

            return connection.then(conn => ({
                connection: conn,
                setup: setupDatabase(conn)
            }));
        })
        .then(({ connection }) => {
            console.log('Database setup completed successfully!');
            return connection.end();
        })
        .catch(error => {
            console.error('Database setup failed:', error);
            process.exit(1);
        });
}
