const { executeQuery, executeTransaction } = require('./connection');
const { v4: uuidv4 } = require('uuid');

// Helper function to generate UUID
function generateId() {
  return uuidv4();
}

// Helper function to format date for MySQL
function formatDate(date) {
  return date ? new Date(date).toISOString().slice(0, 19).replace('T', ' ') : null;
}

// User Model
const UserModel = {
  // Create new user
  async create(userData) {
    const id = generateId();
    const sql = `
      INSERT INTO users (id, name, email, password_hash, role, department_id, position, phone, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      id, userData.name, userData.email, userData.password_hash, 
      userData.role || 'student', userData.department_id, userData.position, 
      userData.phone || '', userData.avatar || ''
    ];
    
    await executeQuery(sql, params);
    return { id, ...userData };
  },

  // Find user by ID
  async findById(id) {
    const sql = `
      SELECT u.*, d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `;
    const users = await executeQuery(sql, [id]);
    return users[0] || null;
  },

  // Find user by email
  async findByEmail(email) {
    const sql = `
      SELECT u.*, d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.email = ?
    `;
    const users = await executeQuery(sql, [email]);
    return users[0] || null;
  },

  // Update user
  async update(id, updateData) {
    const fields = Object.keys(updateData)
      .filter(key => key !== 'id')
      .map(key => `${key} = ?`);
    
    const sql = `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    const params = [...Object.values(updateData).filter((_, i) => i !== 0), id];
    
    await executeQuery(sql, params);
    return this.findById(id);
  },

  // Get all users with pagination
  async findAll(limit = 50, offset = 0, filters = {}) {
    let sql = `
      SELECT u.*, d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.role) {
      sql += ' AND u.role = ?';
      params.push(filters.role);
    }

    if (filters.department_id) {
      sql += ' AND u.department_id = ?';
      params.push(filters.department_id);
    }

    if (filters.is_active !== undefined) {
      sql += ' AND u.is_active = ?';
      params.push(filters.is_active);
    }

    sql += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return await executeQuery(sql, params);
  },

  // Update last login
  async updateLastLogin(id) {
    const sql = 'UPDATE users SET last_login = NOW(), first_login = FALSE WHERE id = ?';
    await executeQuery(sql, [id]);
  }
};

// Meeting Model
const MeetingModel = {
  // Create new meeting
  async create(meetingData) {
    const id = generateId();
    const sql = `
      INSERT INTO meetings (id, title, description, organizer_id, venue_id, meeting_type, 
                           virtual_link, meet_code, start_time, end_time, is_recurring, 
                           recurrence_pattern, max_participants)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      id, meetingData.title, meetingData.description, meetingData.organizer_id,
      meetingData.venue_id, meetingData.meeting_type || 'in_person', 
      meetingData.virtual_link || '', meetingData.meet_code || '', 
      meetingData.start_time, meetingData.end_time, meetingData.is_recurring || false,
      meetingData.recurrence_pattern ? JSON.stringify(meetingData.recurrence_pattern) : null,
      meetingData.max_participants
    ];

    await executeQuery(sql, params);
    return { id, ...meetingData };
  },

  // Find meeting by ID
  async findById(id) {
    const sql = `
      SELECT m.*, u.name as organizer_name, v.name as venue_name, v.location as venue_location
      FROM meetings m
      LEFT JOIN users u ON m.organizer_id = u.id
      LEFT JOIN venues v ON m.venue_id = v.id
      WHERE m.id = ?
    `;
    const meetings = await executeQuery(sql, [id]);
    return meetings[0] || null;
  },

  // Get meetings with filters
  async findWithFilters(filters = {}, limit = 50, offset = 0) {
    let sql = `
      SELECT m.*, u.name as organizer_name, v.name as venue_name, v.location as venue_location
      FROM meetings m
      LEFT JOIN users u ON m.organizer_id = u.id
      LEFT JOIN venues v ON m.venue_id = v.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.organizer_id) {
      sql += ' AND m.organizer_id = ?';
      params.push(filters.organizer_id);
    }

    if (filters.venue_id) {
      sql += ' AND m.venue_id = ?';
      params.push(filters.venue_id);
    }

    if (filters.status) {
      sql += ' AND m.status = ?';
      params.push(filters.status);
    }

    if (filters.start_date) {
      sql += ' AND DATE(m.start_time) >= ?';
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      sql += ' AND DATE(m.end_time) <= ?';
      params.push(filters.end_date);
    }

    sql += ' ORDER BY m.start_time DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return await executeQuery(sql, params);
  },

  // Update meeting
  async update(id, updateData) {
    const fields = Object.keys(updateData)
      .filter(key => key !== 'id')
      .map(key => `${key} = ?`);
    
    const sql = `UPDATE meetings SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    const params = [...Object.values(updateData).filter((_, i) => i !== 0), id];
    
    await executeQuery(sql, params);
    return this.findById(id);
  }
};

// Venue Model
const VenueModel = {
  // Create new venue
  async create(venueData) {
    const id = generateId();
    const sql = `
      INSERT INTO venues (id, name, location, capacity, description, amenities)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      id, venueData.name, venueData.location, venueData.capacity,
      venueData.description || '', 
      venueData.amenities ? JSON.stringify(venueData.amenities) : '[]'
    ];

    await executeQuery(sql, params);
    return { id, ...venueData };
  },

  // Find venue by ID
  async findById(id) {
    const sql = 'SELECT * FROM venues WHERE id = ?';
    const venues = await executeQuery(sql, [id]);
    return venues[0] || null;
  },

  // Get all venues
  async findAll(activeOnly = true) {
    let sql = 'SELECT * FROM venues';
    const params = [];

    if (activeOnly) {
      sql += ' WHERE is_active = TRUE';
    }

    sql += ' ORDER BY name';
    return await executeQuery(sql, params);
  },

  // Check venue availability
  async checkAvailability(venueId, startTime, endTime, excludeMeetingId = null) {
    let sql = `
      SELECT COUNT(*) as count
      FROM meetings m
      WHERE m.venue_id = ? 
        AND m.status != 'cancelled'
        AND (
          (m.start_time < ? AND m.end_time > ?) OR
          (m.start_time < ? AND m.end_time > ?) OR
          (m.start_time >= ? AND m.end_time <= ?)
        )
    `;
    const params = [venueId, endTime, startTime, endTime, startTime, startTime, endTime];

    if (excludeMeetingId) {
      sql += ' AND m.id != ?';
      params.push(excludeMeetingId);
    }

    const result = await executeQuery(sql, params);
    return result[0].count === 0;
  }
};

// Booking Model
const BookingModel = {
  // Create new booking
  async create(bookingData) {
    const id = generateId();
    const sql = `
      INSERT INTO bookings (id, venue_id, user_id, meeting_id, title, description, 
                           start_time, end_time, attendees_count, purpose)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      id, bookingData.venue_id, bookingData.user_id, bookingData.meeting_id || null,
      bookingData.title, bookingData.description || '', bookingData.start_time, 
      bookingData.end_time, bookingData.attendees_count || 1, bookingData.purpose || ''
    ];

    await executeQuery(sql, params);
    return { id, ...bookingData };
  },

  // Find booking by ID
  async findById(id) {
    const sql = `
      SELECT b.*, u.name as user_name, v.name as venue_name, v.location as venue_location
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN venues v ON b.venue_id = v.id
      WHERE b.id = ?
    `;
    const bookings = await executeQuery(sql, [id]);
    return bookings[0] || null;
  },

  // Get user bookings
  async findByUser(userId, limit = 50, offset = 0) {
    const sql = `
      SELECT b.*, v.name as venue_name, v.location as venue_location
      FROM bookings b
      LEFT JOIN venues v ON b.venue_id = v.id
      WHERE b.user_id = ?
      ORDER BY b.start_time DESC
      LIMIT ? OFFSET ?
    `;
    return await executeQuery(sql, [userId, limit, offset]);
  },

  // Update booking status
  async updateStatus(id, status, approvedBy = null) {
    const sql = `
      UPDATE bookings 
      SET status = ?, approved_by = ?, approved_at = NOW(), updated_at = NOW()
      WHERE id = ?
    `;
    const params = [status, approvedBy, id];
    
    await executeQuery(sql, params);
    return this.findById(id);
  }
};

// Department Model
const DepartmentModel = {
  // Get all departments
  async findAll(activeOnly = true) {
    let sql = 'SELECT * FROM departments';
    const params = [];

    if (activeOnly) {
      sql += ' WHERE is_active = TRUE';
    }

    sql += ' ORDER BY name';
    return await executeQuery(sql, params);
  },

  // Find department by ID
  async findById(id) {
    const sql = 'SELECT * FROM departments WHERE id = ?';
    const departments = await executeQuery(sql, [id]);
    return departments[0] || null;
  }
};

// Settings Model
const SettingsModel = {
  // Get setting value
  async get(key) {
    const sql = 'SELECT value FROM settings WHERE key_name = ?';
    const settings = await executeQuery(sql, [key]);
    return settings[0]?.value || null;
  },

  // Set setting value
  async set(key, value) {
    const sql = `
      INSERT INTO settings (id, key_name, value) 
      VALUES (?, ?, ?) 
      ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW()
    `;
    await executeQuery(sql, [generateId(), key, value]);
  },

  // Get all settings
  async getAll() {
    const sql = 'SELECT key_name, value, description FROM settings WHERE is_system = TRUE';
    const settings = await executeQuery(sql);
    
    const result = {};
    settings.forEach(setting => {
      result[setting.key_name] = setting.value;
    });
    
    return result;
  }
};

module.exports = {
  UserModel,
  MeetingModel,
  VenueModel,
  BookingModel,
  DepartmentModel,
  SettingsModel,
  generateId,
  formatDate
};
