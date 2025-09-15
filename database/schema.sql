-- SmartMeet UNZA Database Schema
-- Created: 2025-09-15
-- MySQL Version

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'lecturer', 'student', 'staff') NOT NULL,
    department VARCHAR(100),
    phone_number VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    is_first_login BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL DEFAULT NULL,
    password_changed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_email CHECK (email LIKE '%@cs.unza.zm')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    department_id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    faculty VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Venues table
CREATE TABLE IF NOT EXISTS venues (
    venue_id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location TEXT NOT NULL,
    capacity INT,
    facilities JSON,  -- JSON array of facilities
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Meetings table
CREATE TABLE IF NOT EXISTS meetings (
    meeting_id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    venue_id VARCHAR(36),
    meeting_type ENUM('in_person', 'virtual', 'hybrid') NOT NULL,
    meeting_link TEXT,
    status ENUM('scheduled', 'ongoing', 'completed', 'cancelled') NOT NULL,
    organizer_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (organizer_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_meeting_times CHECK (end_time > start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Meeting participants (many-to-many relationship)
CREATE TABLE IF NOT EXISTS meeting_participants (
    meeting_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    status ENUM('pending', 'accepted', 'declined', 'tentative') NOT NULL,
    attended BOOLEAN DEFAULT FALSE,
    join_time DATETIME DEFAULT NULL,
    leave_time DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (meeting_id, user_id),
    FOREIGN KEY (meeting_id) REFERENCES meetings(meeting_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    document_id VARCHAR(36) PRIMARY KEY,
    meeting_id VARCHAR(36),
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,  -- in bytes
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES meetings(meeting_id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Document access logs
CREATE TABLE IF NOT EXISTS document_access_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    document_id VARCHAR(36) NOT NULL,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,  -- 'view', 'download', 'update', 'delete'
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,  -- 'meeting_invite', 'meeting_update', 'document_shared', 'system'
    reference_id TEXT,   -- ID of the related entity (meeting_id, document_id, etc.)
    is_read BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Security logs
CREATE TABLE IF NOT EXISTS security_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    action TEXT NOT NULL,  -- 'login', 'logout', 'password_change', 'permission_denied', etc.
    ip_address TEXT,
    user_agent TEXT,
    details TEXT,  -- JSON string with additional details
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    setting_key TEXT PRIMARY KEY,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_meetings_organizer ON meetings(organizer_id);
CREATE INDEX idx_meetings_venue ON meetings(venue_id);
CREATE INDEX idx_meetings_time ON meetings(start_time, end_time);
CREATE INDEX idx_meeting_participants_meeting ON meeting_participants(meeting_id);
CREATE INDEX idx_meeting_participants_user ON meeting_participants(user_id);
CREATE INDEX idx_documents_meeting ON documents(meeting_id);
CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_users_timestamp
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE user_id = NEW.user_id;
END;

CREATE TRIGGER IF NOT EXISTS update_meetings_timestamp
AFTER UPDATE ON meetings
FOR EACH ROW
BEGIN
    UPDATE meetings SET updated_at = CURRENT_TIMESTAMP WHERE meeting_id = NEW.meeting_id;
END;

-- Insert default admin user
-- Default password is 'admin123' (hashed with bcrypt, cost 10)
-- In a production environment, this should be set up through a proper installation process
INSERT OR IGNORE INTO users (
    user_id,
    email,
    password_hash,
    first_name,
    last_name,
    role,
    is_first_login,
    password_changed_at
) VALUES (
    'admin001',
    'admin@cs.unza.zm',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- admin123
    'System',
    'Administrator',
    'admin',
    1,
    CURRENT_TIMESTAMP
);

-- Insert some default venues
INSERT OR IGNORE INTO venues (venue_id, name, location, capacity, facilities) VALUES
('v001', 'Main Conference Room', 'Computer Science Building, 1st Floor', 30, '["Projector", "Whiteboard", "Video Conferencing"]'),
('v002', 'Lecture Hall A', 'Computer Science Building, Ground Floor', 100, '["Projector", "PA System"]'),
('v003', 'Seminar Room 1', 'Computer Science Building, 2nd Floor', 15, '["Projector", "Whiteboard"]'),
('v004', 'Board Room', 'Main Administration Building', 12, '["Projector", "Video Conferencing", "Whiteboard"]');

-- Insert some default settings
INSERT OR IGNORE INTO settings (setting_key, setting_value, description) VALUES
('system_name', 'SmartMeet UNZA', 'The name of the application'),
('default_meeting_duration', '60', 'Default meeting duration in minutes'),
('min_password_length', '8', 'Minimum password length'),
('max_login_attempts', '5', 'Maximum number of failed login attempts before account lock'),
('account_lockout_time', '30', 'Account lockout duration in minutes'),
('password_expiry_days', '90', 'Password expiry in days'),
('allow_self_registration', '0', 'Whether to allow users to register themselves (0 = no, 1 = yes)');
