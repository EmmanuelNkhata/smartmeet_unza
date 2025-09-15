/**
 * Authentication and Authorization Utilities for SmartMeet UNZA
 * Handles user validation, password policies, and access controls
 */

class AuthUtils {
    // Default password for new accounts
    static DEFAULT_PASSWORD = '123456789';
    
    // Validate email format and domain
    static isValidEmail(email) {
        if (!email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const domainRegex = /@cs\.unza\.zm$/i;
        return emailRegex.test(email) && domainRegex.test(email);
    }
    
    // Check if password meets security requirements
    static validatePassword(password) {
        if (!password) return false;
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
        return passwordRegex.test(password);
    }
    
    // Check if the password is the default password
    static isDefaultPassword(password) {
        return password === this.DEFAULT_PASSWORD;
    }
    
    // Generate a random token for password reset
    static generateToken(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < length; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
    }
    
    // Log security-related events
    static logSecurityEvent(userId, eventType, details = {}) {
        const timestamp = new Date().toISOString();
        const event = {
            timestamp,
            userId,
            eventType,
            details,
            ipAddress: window.location.hostname,
            userAgent: navigator.userAgent
        };
        
        // In a real app, this would be sent to a logging service
        console.log('Security Event:', event);
        
        // Store in local storage for demo purposes
        const logs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
        logs.push(event);
        localStorage.setItem('securityLogs', JSON.stringify(logs));
        
        return event;
    }
    
    // Check if user has required role
    static hasRole(user, requiredRole) {
        if (!user || !user.role) return false;
        return user.role.toLowerCase() === requiredRole.toLowerCase();
    }
    
    // Check if user has permission for a specific action
    static hasPermission(user, permission) {
        // Define role-based permissions
        const permissions = {
            admin: ['create_meeting', 'edit_meeting', 'delete_meeting', 'view_reports', 'manage_users'],
            user: ['view_meetings', 'join_meeting', 'submit_feedback']
        };
        
        if (!user || !user.role) return false;
        const rolePermissions = permissions[user.role.toLowerCase()] || [];
        return rolePermissions.includes(permission);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthUtils;
}
