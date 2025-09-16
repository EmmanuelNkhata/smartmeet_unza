/**
 * Admin-specific JavaScript for SmartMeet UNZA
 * Handles sidebar loading, user authentication, and other admin-specific functionality
 */

// Authentication completely disabled for development
function checkAdminAuth() {
    // Ensure mock user exists
    const mockUser = {
        id: 'dev-admin',
        name: 'Developer Admin',
        email: 'dev@example.com',
        role: 'admin',
        avatar: ''
    };
    
    // Always set mock user and token to prevent redirects
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('authToken', 'dev-token-' + Date.now());
    
    // Override AuthUtils.checkAuth to prevent redirects
    if (typeof AuthUtils !== 'undefined') {
        const originalCheckAuth = AuthUtils.checkAuth;
        AuthUtils.checkAuth = function() {
            return true; // Always return true to prevent redirects
        };
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
    
    // Update profile information in the header
    const headerProfileName = document.getElementById('profileUserName');
    const headerProfileEmail = document.getElementById('profileUserEmail');
    const headerUserInitials = document.getElementById('userInitials');
    const headerUserImage = document.getElementById('userProfileImage');
    
    if (headerProfileName && user.name) {
        headerProfileName.textContent = user.name;
    }
    
    if (headerProfileEmail && user.email) {
        headerProfileEmail.textContent = user.email;
    }
    
    // Set user avatar or initials
    if (user.avatar) {
        if (headerUserImage) {
            headerUserImage.src = user.avatar;
            headerUserImage.classList.remove('hidden');
            if (headerUserInitials) headerUserInitials.classList.add('hidden');
        }
    } else if (headerUserInitials) {
        const name = user.name || 'U';
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
        headerUserInitials.textContent = initials.substring(0, 2);
        headerUserInitials.classList.remove('hidden');
        if (headerUserImage) headerUserImage.classList.add('hidden');
    }
    
    // Update sidebar user info
    const sidebarName = document.getElementById('sidebarUserName');
    const sidebarEmail = document.getElementById('sidebarUserEmail');
    
    if (sidebarName && user.name) {
        sidebarName.textContent = user.name;
    }
    
    if (sidebarEmail && user.email) {
        sidebarEmail.textContent = user.email;
    }
    
    // Update top navigation user info (using the header variables we already have)
    if (headerProfileName && user.name) {
        headerProfileName.textContent = user.name;
    }
    
    if (headerUserInitials) {
        const names = user.name ? user.name.split(' ') : [];
        const initials = names.length > 1 
            ? `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`
            : names[0] ? names[0].charAt(0) : 'U';
        headerUserInitials.textContent = initials.toUpperCase();
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
    
    // Admin menu toggle is now handled by MenuManager
    // The initialization happens in the DOMContentLoaded event listener
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

// Menu management utilities
const MenuManager = {
    // Toggle any menu by ID
    toggleMenu(menuId) {
        const menu = document.getElementById(menuId);
        if (menu) {
            menu.classList.toggle('hidden');
        }
    },
    
    // Close all menus except the specified one
    closeOtherMenus(exceptMenuId) {
        const menus = ['profileMenu', 'notificationsMenu', 'adminMenu'];
        menus.forEach(menuId => {
            if (menuId !== exceptMenuId) {
                const menu = document.getElementById(menuId);
                if (menu) menu.classList.add('hidden');
            }
        });
    },
    
    // Initialize menu toggle button
    initMenuToggle(buttonId, menuId, closeOthers = true) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        
        // Clone to remove existing event listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (closeOthers) {
                this.closeOtherMenus(menuId);
            }
            this.toggleMenu(menuId);
        });
        
        return newButton;
    }
};

// Close menus when clicking outside
document.addEventListener('click', (e) => {
    const isMenuClick = e.target.closest('[data-menu]') || 
                       e.target.closest('[aria-haspopup="menu"]') ||
                       e.target.closest('[role="menu"]');
    
    if (!isMenuClick) {
        MenuManager.closeOtherMenus();
    }
});

// Initialize admin page
document.addEventListener('DOMContentLoaded', () => {
    // Force set mock user and token on every page load
    const mockUser = {
        id: 'dev-admin',
        name: 'Developer Admin',
        email: 'dev@example.com',
        role: 'admin',
        avatar: ''
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('authToken', 'dev-token-' + Date.now());
    
    // Initialize UI components
    try {
        // Initialize notifications menu
        const notificationsBtn = MenuManager.initMenuToggle('notificationsBtn', 'notificationsMenu');
        
        // Initialize admin menu
        const adminMenuBtn = MenuManager.initMenuToggle('adminMenuBtn', 'adminMenu');
        
        // Add active state to admin button when menu is open
        if (adminMenuBtn) {
            adminMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const adminMenu = document.getElementById('adminMenu');
                if (adminMenu) {
                    const isOpen = !adminMenu.classList.contains('hidden');
                    adminMenuBtn.classList.toggle('bg-gray-100', isOpen);
                    adminMenuBtn.classList.toggle('text-blue-600', isOpen);
                }
            });
        }
        
        // Handle admin sign out
        const adminSignOut = document.getElementById('adminSignOut');
        if (adminSignOut) {
            adminSignOut.addEventListener('click', (e) => {
                e.preventDefault();
                // Clear user session
                localStorage.removeItem('user');
                localStorage.removeItem('authToken');
                // Redirect to login page
                window.location.href = '/auth/login.html';
            });
        }
        
        // Theme Toggle Functionality
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            // Check for saved theme preference or use system preference
            const savedTheme = localStorage.getItem('theme') || 
                (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
            
            // Apply the saved theme
            if (savedTheme === 'dark') {
                document.documentElement.classList.add('dark');
                themeToggle.innerHTML = '<i class="fas fa-sun mr-3 w-5 text-center"></i><span>Light Mode</span>';
            }
            
            // Toggle theme
            themeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                const isDark = document.documentElement.classList.toggle('dark');
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
                themeToggle.innerHTML = isDark 
                    ? '<i class="fas fa-sun mr-3 w-5 text-center"></i><span>Light Mode</span>'
                    : '<i class="fas fa-moon mr-3 w-5 text-center"></i><span>Dark Mode</span>';
            });
        }
        
        // Change Password Handler
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // You can implement the change password modal or redirect here
                window.location.href = 'change-password.html';
            });
        }
        
        // Sign Out Handler
        const signOutBtn = document.getElementById('topNavSignOut');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // Clear user session
                localStorage.removeItem('user');
                localStorage.removeItem('authToken');
                // Redirect to login page
                window.location.href = '/auth/login.html';
            });
        }
        
        // Close menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('[aria-haspopup="menu"]') && !e.target.closest('[role="menu"]')) {
                MenuManager.closeOtherMenus();
                // Remove active states
                document.querySelectorAll('[aria-haspopup="menu"]').forEach(btn => {
                    btn.classList.remove('bg-gray-100', 'text-blue-600');
                });
            }
        });
        
        // Update user info in the UI
        updateUserInfo();
        
        // Initialize admin UI components
    } catch (error) {
        console.error('Error initializing admin UI:', error);
    }
    function initAdminUI() {
        
        // Load sidebar if it exists
        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer) {
            loadSidebar();
        }
        
        // Update user info in the admin UI
        updateUserInfo();
        
        // Setup logout handlers
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
