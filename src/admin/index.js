import { authService } from '../shared/auth.js';
import '../shared/styles/main.css';

class AdminDashboard {
  constructor() {
    this.initialize();
  }

  async initialize() {
    try {
      // Check authentication
      if (!authService.isAuthenticated() || !authService.hasRole('admin')) {
        window.location.href = '/auth/login.html';
        return;
      }

      // Load user data
      this.user = JSON.parse(localStorage.getItem('user') || '{}');
      this.setupEventListeners();
      this.loadDashboardData();
    } catch (error) {
      console.error('Failed to initialize admin dashboard:', error);
      this.showError('Failed to load dashboard');
    }
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => this.handleNavigation(e));
    });

    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', () => this.handleLogout());
  }

  async loadDashboardData() {
    try {
      // Show loading state
      this.showLoading(true);
      
      // Fetch dashboard data
      const response = await fetch('/api/admin/dashboard', {
        headers: authService.getAuthHeader()
      });
      
      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }
      
      const data = await response.json();
      this.updateDashboardUI(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.showError('Failed to load dashboard data');
    } finally {
      this.showLoading(false);
    }
  }

  updateDashboardUI(data) {
    // Update user info
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
      userNameElement.textContent = this.user.name || 'Admin';
    }

    // Update stats
    this.updateStat('totalMeetings', data.stats?.totalMeetings || 0);
    this.updateStat('activeMeetings', data.stats?.activeMeetings || 0);
    this.updateStat('totalUsers', data.stats?.totalUsers || 0);
    this.updateStat('pendingApprovals', data.stats?.pendingApprovals || 0);

    // Update recent activities
    this.updateRecentActivities(data.recentActivities || []);
  }

  updateStat(statId, value) {
    const element = document.getElementById(statId);
    if (element) {
      element.textContent = value;
    }
  }

  updateRecentActivities(activities) {
    const container = document.getElementById('recentActivities');
    if (!container) return;

    if (activities.length === 0) {
      container.innerHTML = '<p class="text-gray-500">No recent activities</p>';
      return;
    }

    container.innerHTML = activities
      .map(
        (activity) => `
        <div class="p-4 border-b border-gray-200">
          <p class="font-medium">${activity.title}</p>
          <p class="text-sm text-gray-500">${activity.description}</p>
          <p class="text-xs text-gray-400 mt-1">${new Date(activity.timestamp).toLocaleString()}</p>
        </div>
      `
      )
      .join('');
  }

  handleNavigation(e) {
    e.preventDefault();
    const target = e.currentTarget.getAttribute('href');
    if (target) {
      window.location.href = target;
    }
  }

  async handleLogout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeader()
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authService.logout();
    }
  }

  showLoading(show) {
    const loadingElement = document.getElementById('loadingIndicator');
    if (loadingElement) {
      loadingElement.style.display = show ? 'block' : 'none';
    }
  }

  showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.classList.remove('hidden');
      
      // Hide error after 5 seconds
      setTimeout(() => {
        errorContainer.classList.add('hidden');
      }, 5000);
    }
  }
}

// Initialize the admin dashboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AdminDashboard();
});
