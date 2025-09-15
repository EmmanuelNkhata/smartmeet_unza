t-- SmartMeet UNZA Database Schema - MySQL Version
-- Created: 2025-09-09

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS smartmeet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE smartmeet;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'lecturer', 'student', 'staff') NOT NULL,
    department VARCHAR(100),
    phone_number VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    is_first_login BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    password_changed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_email CHECK (email LIKE '%@cs.unza.zm')
) ENGINE=InnoDB;

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    department_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    faculty VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Venues table
CREATE TABLE IF NOT EXISTS venues (
    venue_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    capacity INT,
    facilities TEXT,  -- JSON array of facilities
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Meetings table
CREATE TABLE IF NOT EXISTS meetings (
    meeting_id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    venue_id VARCHAR(50),
    meeting_type ENUM('in_person', 'virtual', 'hybrid') NOT NULL,
    meeting_link TEXT,
    status ENUM('scheduled', 'ongoing', 'completed', 'cancelled') NOT NULL,
    organizer_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE SET NULL,
    FOREIGN KEY (organizer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_meeting_time CHECK (end_time > start_time)
) ENGINE=InnoDB;

-- Meeting participants (many-to-many relationship)
CREATE TABLE IF NOT EXISTS meeting_participants (
    meeting_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    status ENUM('pending', 'accepted', 'declined', 'tentative') NOT NULL,
    attended BOOLEAN DEFAULT FALSE,
    join_time DATETIME NULL,
    leave_time DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (meeting_id, user_id),
    FOREIGN KEY (meeting_id) REFERENCES meetings(meeting_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    document_id VARCHAR(50) PRIMARY KEY,
    meeting_id VARCHAR(50),
    user_id VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,  -- in bytes
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES meetings(meeting_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Document access logs
CREATE TABLE IF NOT EXISTS document_access_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    document_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,  -- 'view', 'download', 'update', 'delete'
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,  -- 'meeting_invite', 'meeting_update', 'document_shared', 'system'
    reference_id VARCHAR(50),   -- ID of the related entity (meeting_id, document_id, etc.)
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Security logs
CREATE TABLE IF NOT EXISTS security_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50),
    action VARCHAR(100) NOT NULL,  -- 'login', 'logout', 'password_change', 'permission_denied', etc.
    ip_address VARCHAR(45),
    user_agent TEXT,
    details TEXT,  -- JSON string with additional details
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Create indexes for better performance
CREATE INDEX idx_meetings_organizer ON meetings(organizer_id);
CREATE INDEX idx_meetings_venue ON meetings(venue_id);
CREATE INDEX idx_meetings_time ON meetings(start_time, end_time);
CREATE INDEX idx_meeting_participants_meeting ON meeting_participants(meeting_id);
CREATE INDEX idx_meeting_participants_user ON meeting_participants(user_id);
CREATE INDEX idx_documents_meeting ON documents(meeting_id);
CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- Insert default admin user
-- Default password is 'admin123' (hashed with bcrypt, cost 10)
INSERT IGNORE INTO users (
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
    TRUE,
    CURRENT_TIMESTAMP
);

-- Insert some default venues
INSERT IGNORE INTO venues (venue_id, name, location, capacity, facilities) VALUES
('v001', 'Main Conference Room', 'Computer Science Building, 1st Floor', 30, '["Projector", "Whiteboard", "Video Conferencing"]'),
('v002', 'Lecture Hall A', 'Computer Science Building, Ground Floor', 100, '["Projector", "PA System"]'),
('v003', 'Seminar Room 1', 'Computer Science Building, 2nd Floor', 15, '["Projector", "Whiteboard"]'),
('v004', 'Board Room', 'Main Administration Building', 12, '["Projector", "Video Conferencing", "Whiteboard"]');

-- Insert some default settings
INSERT IGNORE INTO settings (setting_key, setting_value, description) VALUES
('system_name', 'SmartMeet UNZA', 'The name of the application'),
('default_meeting_duration', '60', 'Default meeting duration in minutes'),
('email_notifications_enabled', 'true', 'Whether email notifications are enabled'),
('max_meeting_participants', '50', 'Maximum number of participants per meeting');
