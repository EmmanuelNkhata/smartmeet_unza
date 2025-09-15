// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const adminNav = document.getElementById('admin-nav');
const userNav = document.getElementById('user-nav');
const contentSections = document.querySelectorAll('.content-section');
const navItems = document.querySelectorAll('.nav-item');
const navGroups = document.querySelectorAll('.nav-group');

// Toggle sidebar on mobile
sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
    sidebar.classList.toggle('translate-x-0');
});

// Toggle submenu for navigation groups
navGroups.forEach(group => {
    const toggle = group.querySelector('[data-toggle]');
    const submenu = group.querySelector('.nav-submenu');
    const icon = toggle.querySelector('.fa-chevron-down');
    
    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        submenu.classList.toggle('hidden');
        icon.classList.toggle('rotate-180');
    });
});

// Handle navigation item clicks
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        // Remove active class from all items
        navItems.forEach(navItem => navItem.classList.remove('active'));
        // Add active class to clicked item
        item.classList.add('active');
        
        // Get the section to show
        const section = item.getAttribute('data-section');
        if (section) {
            loadSection(section);
        }
        
        // Close sidebar on mobile after clicking a link
        if (window.innerWidth < 768) {
            sidebar.classList.add('-translate-x-full');
            sidebar.classList.remove('translate-x-0');
        }
    });
});

// Load section content
function loadSection(section) {
    // Hide all content sections
    contentSections.forEach(section => section.classList.add('hidden'));
    
    // Show the selected section
    const targetSection = document.getElementById(`${section}-content`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    } else {
        // If section doesn't exist, show a default message
        const otherContent = document.getElementById('other-content');
        otherContent.innerHTML = `
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-2xl font-bold mb-4">${section.replace('-', ' ').toUpperCase()}</h2>
                <p>This section is under development.</p>
            </div>
        `;
        otherContent.classList.remove('hidden');
    }
}

// Initialize the application without authentication
function initializeApp() {
    // Create a default admin user with full access
    const user = {
        name: 'Public Admin',
        role: 'admin',
        email: 'public@example.com',
        isAdmin: true,
        isAuthenticated: true
    };
    
    // Store user in localStorage to simulate being logged in
    localStorage.setItem('user', JSON.stringify(user));
    
    // Update UI to show admin access
    updateUIForUser(user);
    
    // Load dashboard by default
    loadSection('dashboard');
    
    // Remove any login redirects
    window.location.hash = '';
}

// Update UI based on user role
function updateUIForUser(user) {
    const userNameElement = document.getElementById('user-name');
    const userRoleElement = document.getElementById('user-role');
    
    if (userNameElement) userNameElement.textContent = user.name;
    if (userRoleElement) userRoleElement.textContent = user.role.toUpperCase();
    
    // Show/hide navigation based on user role
    if (user.role === 'admin') {
        adminNav.classList.remove('hidden');
        userNav.classList.add('hidden');
    } else {
        adminNav.classList.add('hidden');
        userNav.classList.remove('hidden');
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth < 768 && !sidebar.contains(e.target) && e.target !== sidebarToggle) {
        sidebar.classList.add('-translate-x-full');
        sidebar.classList.remove('translate-x-0');
    }
});

// Add rotate utility class to Tailwind
const style = document.createElement('style');
style.textContent = `
    .rotate-180 {
        transform: rotate(180deg);
    }
`;
document.head.appendChild(style);
