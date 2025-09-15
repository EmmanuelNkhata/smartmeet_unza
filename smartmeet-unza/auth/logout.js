// Clear all authentication data from storage
function logout() {
    // Clear localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('isFirstLogin');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear any cookies
    document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.split('=');
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
    
    // Redirect to login page
    window.location.href = '/auth/login.html';
}

// Call logout when the page loads
document.addEventListener('DOMContentLoaded', () => {
    logout();
});
