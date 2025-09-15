// Authentication utilities for SmartMeet UNZA

class AuthUtils {
    // Check if user is logged in
    static isAuthenticated() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const token = localStorage.getItem('authToken');
        return !!(user && token);
    }

    // Get current user
    static getCurrentUser() {
        return JSON.parse(localStorage.getItem('user') || '{}');
    }

    // Check if user has required role
    static hasRole(requiredRole) {
        const user = this.getCurrentUser();
        if (!user || !user.role) return false;
        return user.role === requiredRole || user.role === 'admin';
    }

    // Redirect to login if not authenticated
    static requireAuth(requiredRole = null) {
        if (!this.isAuthenticated()) {
            sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
            window.location.href = '/auth/login.html';
            return false;
        }
        
        if (requiredRole && !this.hasRole(requiredRole)) {
            window.location.href = '/403.html';
            return false;
        }
        
        return true;
    }

    // Logout function
    static logout(redirectToLogin = true) {
        // Clear all auth data
        ['isLoggedIn', 'userEmail', 'userRole', 'userName', 'authToken', 'lastLogin', 'user'].forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
        
        // Clear any cookies
        document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        
        if (redirectToLogin) {
            window.location.href = '/auth/logout.html';
        }
        
        return true;
    }

    // Check if current route requires authentication
    static checkAuth() {
        const publicRoutes = ['/auth/login.html', '/auth/logout.html', '/auth/forgot-password.html'];
        const currentPath = window.location.pathname;
        
        // Skip auth check for public routes
        if (publicRoutes.some(route => currentPath.endsWith(route))) {
            return true;
        }
        
        return this.requireAuth();
    }

    // Initialize authentication checks
    static init() {
        // Check authentication status
        this.checkAuth();
        
        // Update UI based on auth status
        this.updateAuthUI();
    }

    // Update UI elements based on authentication status
    static updateAuthUI() {
        const user = this.getCurrentUser();
        const userNameElements = document.querySelectorAll('.user-name, #userName');
        const userEmailElements = document.querySelectorAll('.user-email, #userEmail');
        const userAvatarElements = document.querySelectorAll('.user-avatar, #userAvatar');
        
        // Update user info in the UI
        if (user && user.name) {
            userNameElements.forEach(el => el.textContent = user.name);
        }
        
        if (user && user.email) {
            userEmailElements.forEach(el => el.textContent = user.email);
        }
        
        // Update avatar with initials if no image
        if (user && user.name) {
            const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
            userAvatarElements.forEach(el => {
                if (!el.src) {
                    el.textContent = initials.substring(0, 2);
                }
            });
        }
    }
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    AuthUtils.init();
});

// Make AuthUtils available globally
window.AuthUtils = AuthUtils;
