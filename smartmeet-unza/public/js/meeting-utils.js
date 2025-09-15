/**
 * Meeting Management Utilities for SmartMeet UNZA
 * Handles meeting validation, scheduling conflicts, and attendance tracking
 */

class MeetingUtils {
    // Check for scheduling conflicts
    static hasSchedulingConflict(meeting, allMeetings) {
        if (!meeting || !allMeetings || !Array.isArray(allMeetings)) return false;
        
        const { id, venue, startTime, endTime } = meeting;
        
        return allMeetings.some(existingMeeting => {
            // Skip the current meeting when checking for conflicts during updates
            if (existingMeeting.id === id) return false;
            
            // Check if same venue
            if (existingMeeting.venue === venue) {
                const existingStart = new Date(existingMeeting.startTime);
                const existingEnd = new Date(existingMeeting.endTime);
                const newStart = new Date(startTime);
                const newEnd = new Date(endTime);
                
                // Check for time overlap
                return (
                    (newStart >= existingStart && newStart < existingEnd) ||
                    (newEnd > existingStart && newEnd <= existingEnd) ||
                    (newStart <= existingStart && newEnd >= existingEnd)
                );
            }
            return false;
        });
    }
    
    // Validate meeting data before saving
    static validateMeeting(meeting, allMeetings = []) {
        const errors = [];
        const now = new Date();
        const startTime = new Date(meeting.startTime);
        const endTime = new Date(meeting.endTime);
        
        // Required fields
        if (!meeting.title?.trim()) {
            errors.push('Meeting title is required');
        }
        
        if (!meeting.venue?.trim()) {
            errors.push('Venue is required');
        }
        
        // Date validations
        if (startTime <= now) {
            errors.push('Start time must be in the future');
        }
        
        if (endTime <= startTime) {
            errors.push('End time must be after start time');
        }
        
        // Check for scheduling conflicts
        if (this.hasSchedulingConflict(meeting, allMeetings)) {
            errors.push('The selected venue is already booked at the chosen time');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    // Record meeting attendance - only for in-person and hybrid meetings
    static recordAttendance(meetingId, userId, status = 'present') {
        const meetings = JSON.parse(localStorage.getItem('meetings') || '[]');
        const meeting = meetings.find(m => m.id === meetingId);
        
        if (!meeting) {
            throw new Error('Meeting not found');
        }
        
        // Only track attendance for in-person and hybrid meetings
        if (meeting.meetingType === 'virtual') {
            return [];
        }
        
        // Initialize attendance array if it doesn't exist
        if (!meeting.attendance) {
            meeting.attendance = [];
        }
        
        // Update or add attendance record
        const existingIndex = meeting.attendance.findIndex(a => a.userId === userId);
        if (existingIndex >= 0) {
            meeting.attendance[existingIndex] = { userId, status, timestamp: new Date().toISOString() };
        } else {
            meeting.attendance.push({ userId, status, timestamp: new Date().toISOString() });
        }
        
        // Save back to storage
        localStorage.setItem('meetings', JSON.stringify(meetings));
        
        // Log the attendance
        if (typeof AuthUtils !== 'undefined') {
            AuthUtils.logSecurityEvent(userId, 'attendance_recorded', { 
                meetingId, 
                status,
                meetingTitle: meeting.title
            });
        }
        
        return meeting.attendance;
    }
    
    // Generate meeting report
    static generateMeetingReport(meetingId) {
        const meetings = JSON.parse(localStorage.getItem('meetings') || '[]');
        const meeting = meetings.find(m => m.id === meetingId);
        
        if (!meeting) {
            throw new Error('Meeting not found');
        }
        
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Skip attendance tracking for virtual meetings
        if (meeting.meetingType === 'virtual') {
            return {
                meetingId: meeting.id,
                title: meeting.title,
                date: meeting.startTime,
                venue: 'Virtual Meeting',
                organizer: meeting.organizer,
                totalInvited: meeting.invitees?.length || 0,
                isVirtual: true,
                agenda: meeting.agenda,
                notes: meeting.notes,
                documents: meeting.documents || [],
                generatedAt: new Date().toISOString()
            };
        }
        
        // For in-person and hybrid meetings, include attendance data
        const attendance = meeting.attendance || [];
        const presentCount = attendance.filter(a => a.status === 'present').length;
        const absentCount = attendance.filter(a => a.status === 'absent').length;
        const totalInvited = meeting.invitees?.length || 0;
        
        // Prepare detailed attendance
        const detailedAttendance = (meeting.invitees || []).map(inviteeId => {
            const user = users.find(u => u.id === inviteeId) || { id: inviteeId, name: 'Unknown User' };
            const attendanceRecord = attendance.find(a => a.userId === inviteeId);
            return {
                userId: inviteeId,
                name: user.name,
                email: user.email,
                status: attendanceRecord?.status || 'not_responded',
                timestamp: attendanceRecord?.timestamp
            };
        });
        
        return {
            meetingId: meeting.id,
            title: meeting.title,
            date: meeting.startTime,
            venue: meeting.venue,
            organizer: meeting.organizer,
            totalInvited,
            presentCount,
            absentCount,
            attendanceRate: totalInvited > 0 ? Math.round((presentCount / totalInvited) * 100) : 0,
            detailedAttendance,
            isVirtual: false,
            agenda: meeting.agenda,
            notes: meeting.notes,
            documents: meeting.documents || [],
            generatedAt: new Date().toISOString()
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MeetingUtils;
}
