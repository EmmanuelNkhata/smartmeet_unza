// Clear all authentication data from storage
function logout() {
    console.log('Logging out...');
    
    // Clear all localStorage items related to authentication
    const authItems = [
        'isLoggedIn', 'userRole', 'userEmail', 'userName', 'isFirstLogin',
        'authToken', 'user', 'authState', 'token', 'currentUser', 'google_token',
        'google_auth_state', 'session_token', 'refresh_token', 'access_token'
    ];
    
    authItems.forEach(item => {
        localStorage.removeItem(item);
    });
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear all cookies
    document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    });
    
    // Clear any in-memory authentication state
    if (window.AuthUtils) {
        window.AuthUtils = null;
    }
    
    // Clear Google Auth if it exists
    if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
            google.accounts.id.disableAutoSelect();
            google.accounts.id.revoke(localStorage.getItem('email'), done => {
                console.log('Google session revoked');
            });
        } catch (e) {
            console.warn('Error revoking Google session:', e);
        }
    }
    
    // Force a hard redirect to login page with a timestamp to prevent caching
    const timestamp = new Date().getTime();
    const loginUrl = `/auth/login.html?logout=${timestamp}`;
    
    // Clear any pending redirects or auth states
    history.pushState(null, null, loginUrl);
    window.location.replace(loginUrl);
}

// Call logout when the page loads
document.addEventListener('DOMContentLoaded', () => {
    logout();
});
