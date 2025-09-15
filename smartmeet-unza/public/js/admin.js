/**
 * Admin-specific JavaScript for SmartMeet UNZA
 * Handles sidebar loading, user authentication, and other admin-specific functionality
 */

// Check if user is authenticated and has admin role
function checkAdminAuth() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('authToken');
    
    if (!user || !token) {
        // Redirect to login if not authenticated
        window.location.href = '/auth/login.html';
        return false;
    }
    
    if (user.role !== 'admin') {
        // Redirect to unauthorized page if not admin
        window.location.href = '/403.html';
        return false;
    }
    
    return true;
}

// Load sidebar component
async function loadSidebar() {
    try {
        const response = await fetch('/admin/components/sidebar.html');
        if (!response.ok) throw new Error('Failed to load sidebar');
        
        const sidebarHtml = await response.text();
        const sidebarContainer = document.getElementById('sidebar-container');
        
        if (sidebarContainer) {
            sidebarContainer.innerHTML = sidebarHtml;
            initializeSidebar();
            updateUserInfo();
            setupLogoutHandlers();
        }
    } catch (error) {
        console.error('Error loading sidebar:', error);
    }
}

// Update user information in the UI
function updateUserInfo() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Update sidebar user info
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarUserEmail = document.getElementById('sidebarUserEmail');
    
    if (sidebarUserName && user.name) {
        sidebarUserName.textContent = user.name;
    }
    
    if (sidebarUserEmail && user.email) {
        sidebarUserEmail.textContent = user.email;
    }
    
    // Update top navigation user info
    const profileUserName = document.getElementById('profileUserName');
    const userInitials = document.getElementById('userInitials');
    
    if (profileUserName && user.name) {
        profileUserName.textContent = user.name;
    }
    
    if (userInitials && user.name) {
        // Get initials from name (first letter of first and last name)
        const names = user.name.split(' ');
        const initials = names.length > 1 
            ? `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`
            : names[0].charAt(0);
        userInitials.textContent = initials.toUpperCase();
    }
}

// Setup logout handlers and admin-specific UI elements
function setupLogoutHandlers() {
    // Handle logout button clicks (sidebar and top nav)
    const logoutButtons = document.querySelectorAll('.logout-btn, #signOutBtn, #topNavSignOut');
    logoutButtons.forEach(button => {
        // Remove any existing event listeners to prevent duplicates
        const newBtn = button.cloneNode(true);
        button.parentNode.replaceChild(newBtn, button);
        
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            AuthUtils.logout();
        });
    });
    
    // Handle admin menu toggle in sidebar
    const adminMenuBtn = document.getElementById('adminMenuBtn');
    const adminMenu = document.getElementById('adminMenu');
    
    if (adminMenuBtn && adminMenu) {
        // Remove any existing event listeners to prevent duplicates
        const newAdminBtn = adminMenuBtn.cloneNode(true);
        adminMenuBtn.parentNode.replaceChild(newAdminBtn, adminMenuBtn);
        
        newAdminBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            adminMenu.classList.toggle('hidden');
        });
        
        // Close menu when clicking outside
        const handleAdminMenuClick = (e) => {
            if (!adminMenu.classList.contains('hidden') && 
                !newAdminBtn.contains(e.target) && 
                !adminMenu.contains(e.target)) {
                    adminMenu.classList.add('hidden');
            }
        };
        
        // Close menu with Escape key
        const handleAdminMenuKeydown = (e) => {
            if (e.key === 'Escape' && !adminMenu.classList.contains('hidden')) {
                adminMenu.classList.add('hidden');
            }
        };
        
        // Add event listeners
        document.addEventListener('click', handleAdminMenuClick);
        document.addEventListener('keydown', handleAdminMenuKeydown);
        
        // Cleanup function
        return () => {
            document.removeEventListener('click', handleAdminMenuClick);
            document.removeEventListener('keydown', handleAdminMenuKeydown);
        };
    }
}

// Initialize sidebar functionality
function initializeSidebar() {
    // Toggle sidebar on mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    
    if (sidebarToggle && sidebar && sidebarBackdrop) {
        const openSidebar = () => {
            sidebar.classList.remove('-translate-x-full');
            sidebarBackdrop.classList.remove('hidden');
            document.body.classList.add('overflow-hidden');
        };
        
        const closeSidebar = () => {
            sidebar.classList.add('-translate-x-full');
            sidebarBackdrop.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        };
        
        sidebarToggle.addEventListener('click', (e) => {
            e.preventDefault();
            if (sidebar.classList.contains('-translate-x-full')) {
                openSidebar();
            } else {
                closeSidebar();
            }
        });
        
        sidebarBackdrop.addEventListener('click', closeSidebar);
        
        // Close sidebar when clicking on a link in the sidebar on mobile
        document.querySelectorAll('#sidebar a').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 768) {
                    closeSidebar();
                }
            });
        });
        
        // Close sidebar with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !sidebar.classList.contains('-translate-x-full')) {
                closeSidebar();
            }
        });
    }
    
    // Highlight current page in sidebar
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const sidebarLinks = document.querySelectorAll('#sidebar a');
    
    sidebarLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref && (linkHref === currentPath || 
            (currentPath === 'index.html' && linkHref.endsWith('index.html')) ||
            (currentPath === '' && linkHref.endsWith('index.html')))) {
            link.classList.add('bg-blue-900');
            link.classList.remove('hover:bg-blue-700');
        }
    });
}

// Initialize admin page
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication and permissions
    if (!checkAdminAuth()) return;
    
    // Initialize admin-specific UI components
    function initAdminUI() {
        // Load sidebar if it exists
        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer) {
            loadSidebar();
        }
        
        // Update user info in the admin UI
        updateUserInfo();
        
        // Setup admin-specific event handlers
        setupLogoutHandlers();
    }
    
    // Initialize after a short delay to ensure common.js is ready
    setTimeout(initAdminUI, 100);
    
    // Initialize any page-specific functionality
    if (typeof initAdminPage === 'function') {
        initAdminPage();
    }
    
    // Add fade-in animation
    document.body.classList.add('page-fade');
    requestAnimationFrame(() => {
        document.body.classList.add('page-fade-in');
    });
    
    // Close any open dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        // Close profile menu if open
        const profileMenu = document.getElementById('profileMenu');
        const profileMenuButton = document.getElementById('profileMenuButton');
        if (profileMenu && !profileMenu.classList.contains('hidden') && 
            !profileMenuButton.contains(e.target) && 
            !profileMenu.contains(e.target)) {
            profileMenu.classList.add('hidden');
        }
        
        // Close admin menu if open
        const adminMenu = document.getElementById('adminMenu');
        const adminMenuButton = document.getElementById('adminMenuBtn');
        if (adminMenu && !adminMenu.classList.contains('hidden') && 
            adminMenuButton && !adminMenuButton.contains(e.target) && 
            !adminMenu.contains(e.target)) {
            adminMenu.classList.add('hidden');
        }
    });
    
    // Close dropdowns with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const profileMenu = document.getElementById('profileMenu');
            if (profileMenu && !profileMenu.classList.contains('hidden')) {
                profileMenu.classList.add('hidden');
            }
            
            const adminMenu = document.getElementById('adminMenu');
            if (adminMenu && !adminMenu.classList.contains('hidden')) {
                adminMenu.classList.add('hidden');
            }
        }
    });
});
