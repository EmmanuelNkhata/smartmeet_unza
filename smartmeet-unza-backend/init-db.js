const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const DB_FILE = path.join(__dirname, 'data', 'db.json');
const SALT_ROUNDS = 10;

async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function initializeDatabase() {
  try {
    const adminPassword = await hashPassword('admin123');
    
    const defaultData = {
      users: [
        {
          id: uuidv4(),
          name: 'System Administrator',
          email: 'admin@unza.zm',
          passwordHash: adminPassword,
          role: 'admin',
          department: 'Administration',
          position: 'System Administrator',
          phone: '',
          avatar: '',
          isActive: true,
          lastLogin: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      meetings: [],
      venues: [
        {
          id: uuidv4(),
          name: 'Main Conference Room',
          location: 'Main Building, 1st Floor',
          capacity: 20,
          description: 'Main conference room with projector and video conferencing',
          amenities: ['projector', 'video_conferencing', 'whiteboard'],
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: uuidv4(),
          name: 'Small Meeting Room',
          location: 'ICT Building, Ground Floor',
          capacity: 8,
          description: 'Small meeting room for team discussions',
          amenities: ['tv', 'whiteboard'],
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: uuidv4(),
          name: 'Lecture Hall A',
          location: 'Science Building, 2nd Floor',
          capacity: 50,
          description: 'Large lecture hall with audio system',
          amenities: ['projector', 'audio_system', 'podium'],
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ],
      bookings: [],
      notifications: [],
      documents: [],
      departments: [
        { id: uuidv4(), name: 'Computer Science', code: 'CS', isActive: true },
        { id: uuidv4(), name: 'Information Technology', code: 'IT', isActive: true },
        { id: uuidv4(), name: 'Engineering', code: 'ENG', isActive: true },
        { id: uuidv4(), name: 'Business', code: 'BUS', isActive: true },
        { id: uuidv4(), name: 'Science', code: 'SCI', isActive: true },
        { id: uuidv4(), name: 'Education', code: 'EDU', isActive: true }
      ],
      settings: {
        bookingWindow: 30,
        maxMeetingDuration: 240,
        minMeetingNotice: 30,
        workingHours: {
          start: '08:00',
          end: '17:00',
          days: [1, 2, 3, 4, 5]
        },
        emailNotifications: true,
        smsNotifications: false,
        maintenanceMode: false
      },
      _migrated: true
    };

    await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
    await fs.writeFile(DB_FILE, JSON.stringify(defaultData, null, 2));
    
    console.log('✅ Database initialized successfully!');
    console.log('Admin credentials:');
    console.log('Email: admin@unza.zm');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();
