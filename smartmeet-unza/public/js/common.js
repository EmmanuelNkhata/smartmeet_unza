/**
 * Common UI functionality for SmartMeet UNZA
 * Handles notifications, profile menu, and other shared components
 */

// Prevent multiple initializations
if (window.smartMeetCommonInitialized) {
    console.log('SmartMeet Common UI already initialized');
} else {
    window.smartMeetCommonInitialized = true;
    
    // Load components
    async function loadComponents() {
        try {
            // Load header
            const headerContainer = document.getElementById('header-container');
            if (headerContainer) {
                try {
                    const response = await fetch('../components/header.html');
                    if (response.ok) {
                        headerContainer.innerHTML = await response.text();
                    } else {
                        console.error('Failed to load header:', response.status, response.statusText);
                    }
                } catch (error) {
                    console.error('Error loading header:', error);
                }
            }
            
            // Load sidebar
            const sidebarContainer = document.getElementById('sidebar-container');
            if (sidebarContainer) {
                try {
                    const response = await fetch('../components/sidebar.html');
                    if (response.ok) {
                        sidebarContainer.innerHTML = await response.text();
                    } else {
                        console.error('Failed to load sidebar:', response.status, response.statusText);
                    }
                } catch (error) {
                    console.error('Error loading sidebar:', error);
                }
            }
            
            // Initialize other UI components
            if (typeof initCommonUI === 'function') {
                initCommonUI();
            }
        } catch (error) {
            console.error('Error loading components:', error);
        }
    }

    // Function to close all open dropdowns
    function closeAllDropdowns() {
        const dropdowns = ['profileMenu', 'notificationsPanel'];
        dropdowns.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
    }

// Function to initialize common UI components
function initializeCommonUI() {
    // Initialize elements
    const profileMenuButton = document.getElementById('profileMenuButton');
    const profileMenu = document.getElementById('profileMenu');
    const notificationsButton = document.querySelector('.notifications-button');
    const notificationsPanel = document.getElementById('notificationsPanel');
    const signOutBtn = document.getElementById('signOutBtn');
    const topNavSignOut = document.getElementById('topNavSignOut');
    
    // Function to handle clicks outside dropdowns
    function handleClickOutside(event) {
        const isClickInside = event.target.closest('#profileMenuButton, #profileMenu, .notifications-button, #notificationsPanel');
        if (!isClickInside) {
            closeAllDropdowns();
        }
    }
    
    // Handle keyboard events for accessibility
    function handleKeyDown(event) {
        if (event.key === 'Escape') {
            closeAllDropdowns();
        }
    }
    
    // Add event listeners
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    // Remove any existing event listeners to prevent duplicates
    document.removeEventListener('DOMContentLoaded', initializeCommonUI);
    
    // Initialize the UI
    initializeUIComponents(profileMenuButton, profileMenu, notificationsButton, notificationsPanel, signOutBtn, topNavSignOut);
}

// Function to initialize UI components
function initializeUIComponents(profileMenuButton, profileMenu, notificationsButton, notificationsPanel, signOutBtn, topNavSignOut) {
    // Initialize elements if not already initialized
    profileMenuButton = profileMenuButton || document.getElementById('profileMenuButton');
    profileMenu = profileMenu || document.getElementById('profileMenu');
    notificationsButton = notificationsButton || document.querySelector('.notifications-button');
    notificationsPanel = notificationsPanel || document.getElementById('notificationsPanel');
    signOutBtn = signOutBtn || document.getElementById('signOutBtn');
    topNavSignOut = topNavSignOut || document.getElementById('topNavSignOut');
    
    // Update user info in the header
    function updateUserInfo() {
        try {
            const userData = JSON.parse(localStorage.getItem('user'));
            if (userData) {
                // Update user initials
                const userInitials = document.getElementById('userInitials');
                if (userInitials && userData.name) {
                    const names = userData.name.split(' ');
                    const initials = names.map(n => n[0]).join('').toUpperCase();
                    userInitials.textContent = initials || 'U';
                }
                
                // Update username in profile menu
                const profileUserName = document.getElementById('profileUserName');
                if (profileUserName) {
                    profileUserName.textContent = userData.name || 'User';
                }
            }
        } catch (e) {
            console.error('Error updating user info:', e);
        }
    }
    
    // Call updateUserInfo when the page loads
    updateUserInfo();

    // Enhanced Profile Menu Toggle
    if (profileMenuButton) {
        profileMenuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = profileMenu.classList.contains('hidden');
            
            // Close all dropdowns first
            closeAllDropdowns();
            
            // Open profile menu if it was hidden
            if (isHidden) {
                profileMenu.classList.remove('hidden');
                // Focus first interactive element for keyboard navigation
                const firstItem = profileMenu.querySelector('a, button');
                if (firstItem) firstItem.focus();
            }
        });
    }

    // Enhanced Notifications Toggle
    if (notificationsButton && notificationsPanel) {
        notificationsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = notificationsPanel.classList.contains('hidden');
            
            // Close all dropdowns first
            closeAllDropdowns();
            
            // Open notifications panel if it was hidden
            if (isHidden) {
                notificationsPanel.classList.remove('hidden');
                // Focus on the notifications panel for keyboard navigation
                notificationsPanel.setAttribute('tabindex', '-1');
                notificationsPanel.focus();
                
                // Load notifications if not already loaded
                const container = notificationsPanel.querySelector('.notifications-container');
                if (container && container.textContent.trim() === 'Loading notifications...') {
                    loadNotifications();
                }
            }
        });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        // Close profile menu if open
        if (profileMenu && !profileMenu.classList.contains('hidden') && 
            !profileMenuButton.contains(e.target) && 
            !profileMenu.contains(e.target)) {
            profileMenu.classList.add('hidden');
        }
        
        // Close notifications panel if open
        if (notificationsPanel && !notificationsPanel.classList.contains('hidden') &&
            !notificationsButton.contains(e.target) &&
            !notificationsPanel.contains(e.target)) {
            notificationsPanel.classList.add('hidden');
        }
    });

    // Close dropdowns with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (profileMenu && !profileMenu.classList.contains('hidden')) {
                profileMenu.classList.add('hidden');
            }
            if (notificationsPanel && !notificationsPanel.classList.contains('hidden')) {
                notificationsPanel.classList.add('hidden');
            }
        }
    });

    // Load notifications
    if (typeof loadNotifications === 'function') {
        loadNotifications();
    } else {
        console.log('loadNotifications function not found');
    }
    
    // Handle sign out
    const handleSignOut = (e) => {
        if (e) e.preventDefault();
        // Clear user session
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to login page
        window.location.href = '/auth/login.html';
    };

    // Add event listeners for sign out buttons
    const signOutButtons = [signOutBtn, topNavSignOut].filter(Boolean);
    signOutButtons.forEach(btn => {
        // Remove any existing event listeners to prevent duplicates
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', handleSignOut);
    });
}

    // Initialize when DOM is fully loaded
function initCommonUI() {
    // Check if we're on an admin page
    const isAdminPage = window.location.pathname.startsWith('/admin/');
    
    // Initialize common UI for all pages
    initializeCommonUI();
    
    // Initialize notifications and profile menu for admin pages
    if (isAdminPage) {
        const notificationsButton = document.querySelector('.notifications-button');
        const notificationsPanel = document.getElementById('notificationsPanel');
        const profileMenuButton = document.getElementById('profileMenuButton');
        const profileMenu = document.getElementById('profileMenu');
        
        // Initialize notifications button
        if (notificationsButton && notificationsPanel) {
            // Remove any existing event listeners
            const newNotificationsButton = notificationsButton.cloneNode(true);
            notificationsButton.parentNode.replaceChild(newNotificationsButton, notificationsButton);
            
            newNotificationsButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const isHidden = notificationsPanel.classList.contains('hidden');
                closeAllDropdowns();
                if (isHidden) {
                    notificationsPanel.classList.remove('hidden');
                    notificationsPanel.setAttribute('aria-expanded', 'true');
                    loadNotifications();
                } else {
                    notificationsPanel.setAttribute('aria-expanded', 'false');
                }
            });
        }
        
        // Initialize profile menu
        if (profileMenuButton && profileMenu) {
            // Remove any existing event listeners
            const newProfileButton = profileMenuButton.cloneNode(true);
            profileMenuButton.parentNode.replaceChild(newProfileButton, profileMenuButton);
            
            newProfileButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const isHidden = profileMenu.classList.contains('hidden');
                closeAllDropdowns();
                if (isHidden) {
                    profileMenu.classList.remove('hidden');
                    profileMenu.setAttribute('aria-expanded', 'true');
                } else {
                    profileMenu.setAttribute('aria-expanded', 'false');
                }
            });
        }
    }
}

    // Initialize mobile menu toggle
    function initMobileMenu() {
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const sidebar = document.getElementById('sidebar-container');
        
        if (mobileMenuButton && sidebar) {
            mobileMenuButton.addEventListener('click', () => {
                sidebar.classList.toggle('mobile-open');
            });
            
            // Close sidebar when clicking outside
            document.addEventListener('click', (e) => {
                if (!sidebar.contains(e.target) && e.target !== mobileMenuButton && !mobileMenuButton.contains(e.target)) {
                    sidebar.classList.remove('mobile-open');
                }
            });
        }
    }

    // Load components when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            loadComponents().then(() => {
                initMobileMenu();
                // Close mobile menu when clicking on a nav item
                document.querySelectorAll('#sidebar-container .nav-item').forEach(item => {
                    item.addEventListener('click', () => {
                        document.getElementById('sidebar-container').classList.remove('mobile-open');
                    });
                });
            });
        });
    } else {
        loadComponents().then(initMobileMenu);
    }
}

// Generate mock notifications for testing
function generateMockNotifications() {
    const types = ['meeting', 'reminder', 'alert', 'update'];
    const messages = [
        'New meeting scheduled for tomorrow at 10:00 AM',
        'Your meeting request has been approved',
        'Reminder: Team sync in 30 minutes',
        'New document uploaded to the meeting folder',
        'You have 3 pending approvals',
        'System maintenance scheduled for tonight',
        'New message from John Doe'
    ];
    
    return Array.from({ length: 5 }, (_, i) => ({
        id: `mock-${i}`,
        type: types[Math.floor(Math.random() * types.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        read: Math.random() > 0.5
    }));
}

// Load notifications from the server or use mock data
async function loadNotifications() {
    const container = document.querySelector('#notificationsPanel .notifications-container');
    if (!container) return;
    
    // Show loading state
    container.innerHTML = '<div class="p-4 text-center text-gray-500">Loading notifications...</div>';
    
    try {
        let notifications = [];
        
        // Try to fetch from API if available
        try {
            const response = await fetch('/api/notifications', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                }
            });
            
            if (response.ok) {
                notifications = await response.json();
            } else {
                throw new Error('API request failed');
            }
        } catch (apiError) {
            console.warn('Using mock notifications data');
            notifications = generateMockNotifications();
        }
        
        updateNotificationsUI(notifications);
    } catch (error) {
        console.error('Error loading notifications:', error);
        container.innerHTML = `
            <div class="p-4 text-center text-red-500">
                Failed to load notifications. <button onclick="loadNotifications()" class="text-blue-600 hover:underline">Retry</button>
            </div>`;
    }
}

// Update the notifications UI
function updateNotificationsUI(notifications = []) {
    const notificationsPanel = document.getElementById('notificationsPanel');
    const notificationsBadge = document.getElementById('notificationsBadge');
    const container = notificationsPanel?.querySelector('.notifications-container');
    
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Add header with mark all as read button
    const header = document.createElement('div');
    header.className = 'sticky top-0 bg-white z-10 p-2 border-b border-gray-200 flex justify-between items-center';
    header.innerHTML = `
        <span class="text-sm font-medium text-gray-700">Notifications</span>
        <button onclick="markAllNotificationsAsRead()" class="text-xs text-blue-600 hover:text-blue-800">
            Mark all as read
        </button>
    `;
    container.appendChild(header);
    
    // Add notifications list
    const list = document.createElement('div');
    list.className = 'divide-y divide-gray-100 max-h-96 overflow-y-auto';
    
    if (notifications.length === 0) {
        list.innerHTML = `
            <div class="p-4 text-center text-gray-500">
                No new notifications
            </div>
        `;
    } else {
        // Sort by timestamp (newest first)
        const sortedNotifications = [...notifications].sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        // Add each notification
        list.innerHTML = sortedNotifications.map(notification => `
            <div class="p-3 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50' : ''}" 
                 onclick="markNotificationAsRead('${notification.id}')">
                <div class="flex items-start">
                    <div class="flex-shrink-0 pt-0.5">
                        <span class="inline-flex items-center justify-center h-6 w-6 rounded-full ${getNotificationColor(notification.type)}">
                            <i class="${getNotificationIcon(notification.type)} text-white text-xs"></i>
                        </span>
                    </div>
                    <div class="ml-3 flex-1">
                        <p class="text-sm text-gray-800">${notification.message}</p>
                        <p class="mt-1 text-xs text-gray-500">${formatTimeAgo(notification.timestamp)}</p>
                    </div>
                    ${!notification.read ? '<span class="h-2 w-2 rounded-full bg-blue-500"></span>' : ''}
                </div>
            </div>
        `).join('');
    }
    
    container.appendChild(list);
    
    // Update badge with unread count
    if (notificationsBadge) {
        const unreadCount = notifications.filter(n => !n.read).length;
        notificationsBadge.textContent = unreadCount > 9 ? '9+' : unreadCount.toString();
        notificationsBadge.classList.toggle('hidden', unreadCount === 0);
        
        // Add animation for new notifications
        if (unreadCount > 0) {
            notificationsBadge.classList.add('animate-pulse');
            setTimeout(() => notificationsBadge.classList.remove('animate-pulse'), 2000);
        }
    }
    
    // Add mark all as read button if there are unread notifications
    const unreadCount = notifications.filter(n => !n.read).length;
    if (unreadCount > 0) {
        const footer = document.createElement('div');
        footer.className = 'p-2 bg-gray-50 text-center border-t border-gray-100';
        footer.innerHTML = `
            <button id="markAllReadBtn" class="text-xs text-blue-600 hover:text-blue-800">
                Mark all as read
            </button>
        `;
        container.appendChild(footer);
        
        // Add mark all as read handler
        const markAllReadBtn = footer.querySelector('#markAllReadBtn');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', markAllNotificationsAsRead);
        }
    }
}

// Mark all notifications as read
async function markAllNotificationsAsRead() {
    try {
        const response = await fetch('/api/notifications/mark-all-read', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        if (response.ok) {
            // Reload notifications to update UI
            loadNotifications();
        }
    } catch (error) {
        console.error('Error marking notifications as read:', error);
    }
}

// Format time ago
function formatTimeAgo(timestamp) {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return interval + ' years ago';
    if (interval === 1) return '1 year ago';
    
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return interval + ' months ago';
    if (interval === 1) return '1 month ago';
    
    interval = Math.floor(seconds / 86400);
    if (interval > 1) return interval + ' days ago';
    if (interval === 1) return 'yesterday';
    
    interval = Math.floor(seconds / 3600);
    if (interval > 1) return interval + ' hours ago';
    if (interval === 1) return '1 hour ago';
    
    interval = Math.floor(seconds / 60);
    if (interval > 1) return interval + ' minutes ago';
    if (interval === 1) return '1 minute ago';
    
    return 'just now';
}

// Get icon for notification type
function getNotificationIcon(type) {
    const icons = {
        'meeting': 'fas fa-calendar-alt',
        'alert': 'fas fa-exclamation-circle',
        'success': 'fas fa-check-circle',
        'warning': 'fas fa-exclamation-triangle',
        'info': 'fas fa-info-circle',
        'default': 'fas fa-bell'
    };
    return icons[type] || icons['default'];
}

// Get color for notification type
function getNotificationColor(type) {
    const colors = {
        'meeting': 'blue-500',
        'alert': 'red-500',
        'success': 'green-500',
        'warning': 'yellow-500',
        'info': 'blue-400',
        'default': 'gray-500'
    };
    return colors[type] || colors['default'];
}
