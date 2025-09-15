-- SmartMeet UNZA Database Schema
-- MySQL/MariaDB compatible

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS smartmeet_unza;
USE smartmeet_unza;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff', 'student') NOT NULL DEFAULT 'student',
    department_id VARCHAR(36),
    position VARCHAR(255),
    phone VARCHAR(20),
    avatar VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    first_login BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_department (department_id)
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Venues table
CREATE TABLE IF NOT EXISTS venues (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(500) NOT NULL,
    capacity INT NOT NULL,
    description TEXT,
    amenities JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_location (location),
    INDEX idx_capacity (capacity)
);

-- Meetings table
CREATE TABLE IF NOT EXISTS meetings (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    organizer_id VARCHAR(36) NOT NULL,
    venue_id VARCHAR(36),
    meeting_type ENUM('in_person', 'virtual', 'hybrid') DEFAULT 'in_person',
    virtual_link VARCHAR(500),
    meet_code VARCHAR(20),
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern JSON,
    status ENUM('scheduled', 'ongoing', 'completed', 'cancelled') DEFAULT 'scheduled',
    max_participants INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL,
    INDEX idx_start_time (start_time),
    INDEX idx_end_time (end_time),
    INDEX idx_organizer (organizer_id),
    INDEX idx_venue (venue_id),
    INDEX idx_status (status)
);

-- Meeting participants table
CREATE TABLE IF NOT EXISTS meeting_participants (
    id VARCHAR(36) PRIMARY KEY,
    meeting_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    role ENUM('organizer', 'participant', 'guest') DEFAULT 'participant',
    response ENUM('pending', 'accepted', 'declined', 'maybe') DEFAULT 'pending',
    joined_at TIMESTAMP NULL,
    left_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_meeting_user (meeting_id, user_id),
    INDEX idx_meeting (meeting_id),
    INDEX idx_user (user_id),
    INDEX idx_response (response)
);

-- Bookings table (for room reservations)
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(36) PRIMARY KEY,
    venue_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    meeting_id VARCHAR(36),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    attendees_count INT DEFAULT 1,
    purpose VARCHAR(500),
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    approved_by VARCHAR(36),
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_venue (venue_id),
    INDEX idx_user (user_id),
    INDEX idx_start_time (start_time),
    INDEX idx_end_time (end_time),
    INDEX idx_status (status)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    related_entity_type ENUM('meeting', 'booking', 'user', 'system') DEFAULT 'system',
    related_entity_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(36) PRIMARY KEY,
    meeting_id VARCHAR(36),
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_meeting (meeting_id),
    INDEX idx_user (user_id),
    INDEX idx_file_type (file_type)
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id VARCHAR(36) PRIMARY KEY,
    key_name VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description VARCHAR(500),
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT IGNORE INTO settings (id, key_name, value, description, is_system) VALUES
(UUID(), 'booking_window', '30', 'Number of days in advance bookings can be made', TRUE),
(UUID(), 'max_meeting_duration', '240', 'Maximum meeting duration in minutes', TRUE),
(UUID(), 'min_meeting_notice', '30', 'Minimum notice required for meetings in minutes', TRUE),
(UUID(), 'working_hours_start', '08:00', 'Working hours start time', TRUE),
(UUID(), 'working_hours_end', '17:00', 'Working hours end time', TRUE),
(UUID(), 'working_days', '[1,2,3,4,5]', 'Working days (1=Monday, 7=Sunday)', TRUE),
(UUID(), 'email_notifications', 'true', 'Enable email notifications', TRUE),
(UUID(), 'sms_notifications', 'false', 'Enable SMS notifications', TRUE),
(UUID(), 'maintenance_mode', 'false', 'Enable maintenance mode', TRUE);

-- Insert default departments
INSERT IGNORE INTO departments (id, name, code) VALUES
(UUID(), 'Computer Science', 'CS'),
(UUID(), 'Information Technology', 'IT'),
(UUID(), 'Engineering', 'ENG'),
(UUID(), 'Business', 'BUS'),
(UUID(), 'Science', 'SCI'),
(UUID(), 'Education', 'EDU'),
(UUID(), 'Administration', 'ADMIN');

-- Insert default venues
INSERT IGNORE INTO venues (id, name, location, capacity, description, amenities) VALUES
(UUID(), 'Main Conference Room', 'Main Building, 1st Floor', 20, 'Main conference room with projector and video conferencing', '["projector", "video_conferencing", "whiteboard"]'),
(UUID(), 'Small Meeting Room', 'ICT Building, Ground Floor', 8, 'Small meeting room for team discussions', '["tv", "whiteboard"]'),
(UUID(), 'Lecture Hall A', 'Science Building, 2nd Floor', 50, 'Large lecture hall with audio system', '["projector", "audio_system", "podium"]'),
(UUID(), 'Virtual Meeting Space', 'Online', 100, 'Virtual meeting space for remote participants', '["video_conferencing", "screen_sharing", "chat"]');

-- Insert default admin user (password: 123456789)
INSERT IGNORE INTO users (id, name, email, password_hash, role, department_id, position, is_active) VALUES
(UUID(), 'System Administrator', 'admin@unza.zm', '$2a$10$inBifqhXG55wMumKcbJEgOCnL.P2y5pd25Q8vEGBrQc1IP5mPPpx.', 'admin', 
 (SELECT id FROM departments WHERE code = 'ADMIN'), 'System Administrator', TRUE);
