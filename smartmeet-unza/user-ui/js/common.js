// Common JavaScript functionality

// User data (in a real app, this would come from a server)
const userData = {
    name: '',
    email: '',
    role: 'Member',
    avatar: '', // URL to user's profile picture
    notifications: []
};

// Persistence: load/save user data across sessions
const STORAGE_KEY = 'smartmeet_unza_user';
function loadStoredUser() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const obj = JSON.parse(raw);
            if (obj && typeof obj === 'object') {
                // Only merge allowed fields; never pull in notifications from storage
                if (typeof obj.name === 'string') userData.name = obj.name;
                if (typeof obj.email === 'string') userData.email = obj.email;
                if (typeof obj.role === 'string') userData.role = obj.role;
                if (typeof obj.avatar === 'string') userData.avatar = obj.avatar;
                userData.notifications = [];
            }
        }
    } catch (e) { console.warn('Failed to load stored user', e); }
}
function persistUser() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch (e) { console.warn('Failed to persist user', e); }
}
function updateUserData(partial) {
    if (!partial || typeof partial !== 'object') return;
    Object.assign(userData, partial);
    persistUser();
    initUserProfile();
}
// Expose helper
window.updateUserData = updateUserData;

// Theme management
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Check for saved user preference, if any, on load of the website
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    // Set initial theme
    if (currentTheme === 'dark') {
        document.documentElement.classList.add('dark');
        if (themeToggle) {
            themeToggle.querySelector('span').textContent = 'Light Mode';
            themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
        }
    }
    
    // Toggle theme when button is clicked
    if (themeToggle) {
        themeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const isDark = document.documentElement.classList.toggle('dark');
            
            if (isDark) {
                localStorage.setItem('theme', 'dark');
                themeToggle.querySelector('span').textContent = 'Light Mode';
                themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
            } else {
                localStorage.setItem('theme', 'light');
                themeToggle.querySelector('span').textContent = 'Dark Mode';
                themeToggle.querySelector('i').classList.replace('fa-sun', 'fa-moon');
            }
        });
    }
}

// User profile management
function initUserProfile() {
    const headerUserName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userInitials = document.getElementById('userInitials');
    const userProfileImage = document.getElementById('userProfileImage');
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarUserRole = document.getElementById('sidebarUserRole');
    
    // Set user data with sensible fallbacks
    const displayName = (userData.name && userData.name.trim()) ? userData.name.trim() : (userData.email ? userData.email.split('@')[0] : 'User');
    if (headerUserName) headerUserName.textContent = displayName;
    if (sidebarUserName) sidebarUserName.textContent = displayName;
    if (sidebarUserRole) sidebarUserRole.textContent = userData.role || 'Member';
    if (userEmail) userEmail.textContent = userData.email || '';
    
    // Set user avatar or initials
    if (userData.avatar) {
        userProfileImage.src = userData.avatar;
        userProfileImage.classList.remove('hidden');
        if (userInitials) userInitials.classList.add('hidden');
    } else if (userInitials) {
        const initials = (displayName || '').split(/\s+/).filter(Boolean).map(s => s[0]).join('').slice(0,2).toUpperCase() || 'U';
        userInitials.textContent = initials;
    }
    
    // Handle logout
    const logoutBtn = document.getElementById('logoutBtn');
    const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
    const bindLogout = (el) => {
        if (el && !el.dataset.bound) {
            el.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('User logged out');
                // Clear persisted user info if any
                try {
                    ['smartmeet_unza_user','authToken','isLoggedIn','userEmail','userRole','userName','lastLogin','rememberMe']
                      .forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k); });
                } catch {}
                window.location.href = 'index.html';
            });
            el.dataset.bound = '1';
        }
    };
    bindLogout(logoutBtn);
    bindLogout(sidebarLogoutBtn);
}

// Notifications management
function initNotifications() {
    const notificationsBtn = document.getElementById('notificationsBtn');
    const notificationsMenu = document.getElementById('notificationsMenu');
    const notificationsList = document.getElementById('notificationsList');
    const markAllReadBtn = document.getElementById('markAllRead');
    const notificationBadge = document.querySelector('.notification-badge');
    
    // Toggle notifications dropdown
    if (notificationsBtn && notificationsMenu) {
        notificationsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationsMenu.classList.toggle('hidden');
            
            // Mark notifications as read when opened
            if (!notificationsMenu.classList.contains('hidden')) {
                markNotificationsAsRead();
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!notificationsMenu.contains(e.target) && e.target !== notificationsBtn) {
                notificationsMenu.classList.add('hidden');
            }
        });
    }
    
    // Mark all notifications as read
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            markNotificationsAsRead();
        });
    }
    
    // Render notifications
    function renderNotifications() {
        if (!notificationsList) return;
        
        const unreadCount = userData.notifications.filter(n => !n.read).length;
        
        // Update badge
        if (notificationBadge) {
            if (unreadCount > 0) {
                notificationBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
                notificationBadge.classList.remove('hidden');
            } else {
                notificationBadge.classList.add('hidden');
            }
        }
        
        // Render notifications list
        if (userData.notifications.length === 0) {
            notificationsList.innerHTML = '<div class="p-4 text-center text-gray-500">No notifications</div>';
            return;
        }
        
        notificationsList.innerHTML = userData.notifications.map(notification => `
            <a href="#" class="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 ${!notification.read ? 'bg-blue-50' : ''}" data-id="${notification.id}">
                <div class="flex items-start">
                    <div class="flex-shrink-0 mt-0.5">
                        <div class="h-8 w-8 rounded-full flex items-center justify-center ${getNotificationIconColor(notification.type)}">
                            <i class="fas fa-${notification.icon} text-white text-sm"></i>
                        </div>
                    </div>
                    <div class="ml-3 flex-1 overflow-hidden">
                        <p class="text-sm font-medium text-gray-900 truncate">${notification.title}</p>
                        <p class="text-xs text-gray-500 mt-1 truncate">${notification.message}</p>
                        <p class="text-xs text-gray-400 mt-1">${notification.time}</p>
                    </div>
                    ${!notification.read ? '<div class="ml-2 w-2 h-2 bg-blue-500 rounded-full"></div>' : ''}
                </div>
            </a>
        `).join('');
    }
    
    // Mark notifications as read
    function markNotificationsAsRead() {
        userData.notifications = userData.notifications.map(n => ({ ...n, read: true }));
        renderNotifications();
    }
    
    // Helper function to get notification icon color based on type
    function getNotificationIconColor(type) {
        const colors = {
            'meeting': 'bg-blue-500',
            'document': 'bg-green-500',
            'system': 'bg-purple-500',
            'alert': 'bg-red-500'
        };
        return colors[type] || 'bg-gray-500';
    }
    
    // Initial render
    renderNotifications();
}

// Toggle profile dropdown
function setupProfileDropdown() {
    const profileBtn = document.getElementById('profileBtn');
    const profileMenu = document.getElementById('profileMenu');
    const notificationsMenu = document.getElementById('notificationsMenu');

    function setExpanded(expanded) {
        if (profileBtn) profileBtn.setAttribute('aria-expanded', String(expanded));
    }

    function isOpen() {
        return profileMenu && !profileMenu.classList.contains('hidden');
    }

    function toggleProfileMenu(show = null) {
        if (!profileMenu) return;
        if (show === null) {
            const next = profileMenu.classList.contains('hidden');
            profileMenu.classList.toggle('hidden');
            setExpanded(next);
            // Close notifications if opening profile
            if (next && notificationsMenu) {
                notificationsMenu.classList.add('hidden');
            }
        } else {
            profileMenu.classList.toggle('hidden', !show);
            setExpanded(!!show);
            if (show && notificationsMenu) {
                notificationsMenu.classList.add('hidden');
            }
        }
    }

    if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleProfileMenu();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (isOpen()) {
                const within = profileMenu.contains(e.target) || profileBtn.contains(e.target);
                if (!within) toggleProfileMenu(false);
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen()) {
                toggleProfileMenu(false);
            }
        });
    }
}

// Set active navigation item based on current page
function setActiveNavItem() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navItem = document.querySelector(`a[href="${currentPage}"]`);
    
    if (navItem) {
        // Remove active class from all nav items
        document.querySelectorAll('nav a').forEach(item => {
            item.classList.remove('bg-blue-900');
        });
        
        // Add active class to current nav item
        navItem.classList.add('bg-blue-900');
    }
}

// Update page title and description
function updatePageMetadata(title, description) {
    const titleElement = document.getElementById('page-title');
    const descriptionElement = document.getElementById('page-description');
    
    if (titleElement) titleElement.textContent = title;
    if (descriptionElement && typeof description === 'string') descriptionElement.textContent = description;
    document.title = `${title} - SmartMeet UNZA`;
}

// Auto-set page metadata based on the current route
function initPageMetadata() {
    const current = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const pages = {
        'index.html': { title: 'Dashboard', description: 'Overview and quick stats' },
        'documents.html': { title: 'Documents', description: 'Access meeting documents and resources' },
        'notifications.html': { title: 'Notifications', description: 'Latest alerts and reminders' },
        'feedback.html': { title: 'Feedback & Rating', description: 'Share your feedback and rate your meeting experience' },
        'my-meetings.html': { title: 'My Meetings', description: 'View and manage your meetings' },
        'settings.html': { title: 'Settings', description: 'Manage your account and preferences' },
        'profile.html': { title: 'Profile', description: 'View and update your profile' }
    };
    if (pages[current]) {
        updatePageMetadata(pages[current].title, pages[current].description);
    }
}

// App loading overlay
function showAppLoader() {
    if (document.getElementById('app-loader')) return;
    const el = document.createElement('div');
    el.id = 'app-loader';
    el.className = 'fixed inset-0 z-50 flex items-center justify-center bg-white/80';
    el.innerHTML = `
        <div class="flex flex-col items-center">
            <div class="h-10 w-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mb-3"></div>
            <p class="text-sm text-gray-600">Loading...</p>
        </div>`;
    document.body.appendChild(el);
}
function hideAppLoader() {
    const el = document.getElementById('app-loader');
    if (el) el.remove();
}

// Load header and sidebar components, then initialize common behavior
async function injectComponents() {
    const headerContainer = document.getElementById('header-container');
    const sidebarContainer = document.getElementById('sidebar-container');

    // Fallback markup for file:// usage when fetch() is blocked by CORS
    const headerFallback = `<!-- Header Component -->
<header class="bg-white shadow-sm p-4 dark:bg-gray-800">
    <div class="flex justify-between items-center">
        <div>
            <h2 class="text-xl font-semibold text-gray-800 dark:text-white" id="page-title">Page Title</h2>
            <p class="text-sm text-gray-500 dark:text-gray-300" id="page-description">Page description</p>
        </div>
        <div class="flex items-center space-x-4">
            <!-- Notifications Dropdown -->
            <div class="relative">
                <button id="notificationsBtn" class="p-2 rounded-full text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50" aria-label="Notifications">
                    <i class="fas fa-bell text-xl dark:text-gray-300"></i>
                    <span class="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center notification-badge hidden">0</span>
                </button>
                <div id="notificationsMenu" class="hidden absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                    <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex justify-between items-center">
                            <h3 class="font-medium dark:text-white">Notifications</h3>
                            <button id="markAllRead" class="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Mark all as read</button>
                        </div>
                    </div>
                    <div class="max-h-96 overflow-y-auto" id="notificationsList">
                        <div class="p-4 text-center text-gray-500 dark:text-gray-300">Loading notifications...</div>
                    </div>
                    <div class="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-center">
                        <a href="notifications.html" class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">View all notifications</a>
                    </div>
                </div>
            </div>

            <!-- User Profile Dropdown -->
            <div class="relative">
                <button id="profileBtn" class="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50" aria-expanded="false" aria-haspopup="menu">
                    <span class="sr-only">Open user menu</span>
                    <div class="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center overflow-hidden" id="userAvatar">
                        <span id="userInitials" class="font-medium">JD</span>
                        <img id="userProfileImage" src="" alt="Profile" class="hidden h-full w-full object-cover">
                    </div>
                </button>
                <!-- Profile dropdown -->
                <div id="profileMenu" class="hidden absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700" role="menu" aria-orientation="vertical" aria-labelledby="profileBtn">
                    <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <p class="text-sm font-medium text-gray-900 dark:text-white truncate" id="userName">John Doe</p>
                        <p class="text-xs text-gray-500 dark:text-gray-300 truncate" id="userEmail">john.doe@unza.zm</p>
                    </div>
                    <div class="py-1">
                        <a href="profile.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700" role="menuitem">
                            <i class="fas fa-user-edit mr-3 w-5 text-center"></i> Edit Profile
                        </a>
                        <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700" role="menuitem" id="themeToggle">
                            <i class="fas fa-moon mr-3 w-5 text-center"></i>
                            <span>Dark Mode</span>
                        </a>
                        <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                        <a href="#" id="logoutBtn" class="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-gray-700" role="menuitem">
                            <i class="fas fa-sign-out-alt mr-3 w-5 text-center"></i> Sign out
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Toast Notification -->
    <div id="toast" class="fixed top-4 right-4 p-4 rounded-md shadow-lg hidden z-50">
        <div class="flex items-center">
            <div id="toastIcon" class="mr-3">
                <i class="fas fa-check-circle text-green-500"></i>
            </div>
            <div>
                <p id="toastMessage" class="text-sm font-medium text-gray-900 dark:text-white"></p>
            </div>
            <button id="closeToast" class="ml-4 text-gray-400 hover:text-gray-500">
                <i class="fas fa-times"></i>
            </button>
        </div>
    </div>
</header>`;

    const sidebarFallback = `<!-- Sidebar Component -->
<div class="w-64 bg-blue-800 text-white p-4 flex flex-col min-h-screen">
    <div class="flex flex-col items-center py-4 border-b border-blue-700 mb-6">
        <div class="flex items-center justify-center space-x-2 mb-2">
            <span class="text-2xl font-bold">SmartMeet</span>
        </div>
        <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-2">
            <span class="text-blue-800 font-bold text-xl">UNZA</span>
        </div>
        <p class="text-sm text-blue-200">User Panel</p>
    </div>
    <div class="flex items-center mb-8 p-2 bg-blue-700 rounded">
        <div class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mr-3">
            <i class="fas fa-user"></i>
        </div>
        <div>
            <p id="sidebarUserName" class="font-medium">User Name</p>
            <p id="sidebarUserRole" class="text-xs text-blue-200">Member</p>
        </div>
    </div>
    <nav class="space-y-2">
        <a href="index.html" class="flex items-center p-2 rounded hover:bg-blue-700" id="nav-dashboard">
            <i class="fas fa-tachometer-alt w-5 mr-3"></i>
            <span>Dashboard</span>
        </a>
        <a href="my-meetings.html" class="flex items-center p-2 rounded hover:bg-blue-700" id="nav-meetings">
            <i class="fas fa-calendar-alt w-5 mr-3"></i>
            <span>My Meetings</span>
        </a>
        <a href="documents.html" class="flex items-center p-2 rounded hover:bg-blue-700" id="nav-documents">
            <i class="fas fa-file-alt w-5 mr-3"></i>
            <span>Documents</span>
        </a>
        <a href="notifications.html" class="flex items-center p-2 rounded hover:bg-blue-700" id="nav-notifications">
            <i class="fas fa-bell w-5 mr-3"></i>
            <span>Notifications</span>
        </a>
        <a href="feedback.html" class="flex items-center p-2 rounded hover:bg-blue-700" id="nav-feedback">
            <i class="fas fa-star w-5 mr-3"></i>
            <span>Feedback & Rating</span>
        </a>
        <a href="settings.html" class="flex items-center p-2 rounded hover:bg-blue-700" id="nav-settings">
            <i class="fas fa-cog w-5 mr-3"></i>
            <span>Settings</span>
        </a>
    </nav>
</div>`;

    const tasks = [];

    if (headerContainer) {
        tasks.push(
            fetch('components/header.html')
                .then(r => r.text())
                .then(html => { headerContainer.innerHTML = html; })
                .catch(err => {
                    console.warn('Failed to load header via fetch. Falling back to inline header. Error:', err);
                    headerContainer.innerHTML = headerFallback;
                })
        );
    }

    if (sidebarContainer) {
        tasks.push(
            fetch('components/sidebar.html')
                .then(r => r.text())
                .then(html => { sidebarContainer.innerHTML = html; })
                .catch(err => {
                    console.warn('Failed to load sidebar via fetch. Falling back to inline sidebar. Error:', err);
                    sidebarContainer.innerHTML = sidebarFallback;
                })
        );
    }

    await Promise.all(tasks);
}

// Load user from backend
async function loadMe() {
    // Frontend-only mode: skip server request for user info
    return;
}

// Initialize after components are injected
document.addEventListener('DOMContentLoaded', async function() {
    showAppLoader();
    loadStoredUser();
    await injectComponents();
    await loadMe();
    // Also read from login storage keys if present (fallback)
    try {
      const ls = (k)=> localStorage.getItem(k) || sessionStorage.getItem(k) || '';
      const nm = ls('userName');
      const em = ls('userEmail');
      const rl = ls('userRole');
      if (!userData.name && nm) userData.name = nm;
      if (!userData.email && em) userData.email = em;
      if (rl) userData.role = rl;
    } catch(e){}
    initTheme();
    initUserProfile();
    initNotifications();
    setupProfileDropdown();
    initPageMetadata();
    setActiveNavItem();
    hideAppLoader();
});
