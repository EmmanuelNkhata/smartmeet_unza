/**
 * Document Management Utilities for SmartMeet UNZA
 * Handles file uploads, access controls, and document validation
 */

class DocumentUtils {
    // Allowed file types and their MIME types
    static ALLOWED_TYPES = {
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/vnd.ms-powerpoint': 'ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
        'text/plain': 'txt',
        'image/jpeg': 'jpg',
        'image/png': 'png'
    };
    
    // Maximum file size in bytes (10MB)
    static MAX_FILE_SIZE = 10 * 1024 * 1024;
    
    // Validate file before upload
    static validateFile(file) {
        const errors = [];
        
        // Check file type
        if (!this.ALLOWED_TYPES[file.type]) {
            const allowedTypes = Object.values(this.ALLOWED_TYPES).join(', ');
            errors.push(`File type not allowed. Allowed types: ${allowedTypes}`);
        }
        
        // Check file size
        if (file.size > this.MAX_FILE_SIZE) {
            const maxSizeMB = this.MAX_FILE_SIZE / (1024 * 1024);
            errors.push(`File too large. Maximum size is ${maxSizeMB}MB`);
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            fileExtension: this.ALLOWED_TYPES[file.type] || ''
        };
    }
    
    // Generate a unique filename
    static generateFilename(originalName, meetingId, userId) {
        const timestamp = new Date().getTime();
        const randomString = Math.random().toString(36).substring(2, 8);
        const extension = originalName.split('.').pop().toLowerCase();
        return `meeting_${meetingId}_${userId}_${timestamp}_${randomString}.${extension}`;
    }
    
    // Check if user has permission to access a document
    static hasDocumentAccess(user, document, permission = 'view') {
        if (!user || !document) return false;
        
        // Document owner has full access
        if (document.ownerId === user.id) return true;
        
        // Admins can access all documents
        if (user.role === 'admin') return true;
        
        // Check meeting-specific permissions
        if (document.meetingId) {
            const meetings = JSON.parse(localStorage.getItem('meetings') || '[]');
            const meeting = meetings.find(m => m.id === document.meetingId);
            
            // Meeting organizers can access all meeting documents
            if (meeting?.organizerId === user.id) return true;
            
            // Meeting participants can view documents
            if (permission === 'view' && meeting?.participants?.includes(user.id)) {
                return true;
            }
        }
        
        return false;
    }
    
    // Log document access
    static logDocumentAccess(documentId, userId, action = 'view') {
        const logEntry = {
            documentId,
            userId,
            action,
            timestamp: new Date().toISOString(),
            ip: window.location.hostname,
            userAgent: navigator.userAgent
        };
        
        // In a real app, this would be sent to a logging service
        console.log('Document Access:', logEntry);
        
        // Store in local storage for demo purposes
        const logs = JSON.parse(localStorage.getItem('documentAccessLogs') || '[]');
        logs.push(logEntry);
        localStorage.setItem('documentAccessLogs', JSON.stringify(logs));
        
        return logEntry;
    }
    
    // Get document access logs
    static getDocumentAccessLogs(documentId = null, userId = null) {
        let logs = JSON.parse(localStorage.getItem('documentAccessLogs') || '[]');
        
        if (documentId) {
            logs = logs.filter(log => log.documentId === documentId);
        }
        
        if (userId) {
            logs = logs.filter(log => log.userId === userId);
        }
        
        return logs;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DocumentUtils;
}
