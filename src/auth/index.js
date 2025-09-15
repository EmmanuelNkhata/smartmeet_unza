import { authService } from '../shared/auth.js';
import '../shared/styles/main.css';

class LoginPage {
  constructor() {
    this.form = document.getElementById('loginForm');
    this.roleSelection = document.getElementById('roleSelection');
    this.loginFormContainer = document.getElementById('loginFormContainer');
    this.adminSignupForm = document.getElementById('adminSignupForm');
    this.selectedRole = '';
    
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Role selection
    document.getElementById('adminRoleBtn')?.addEventListener('click', () => this.selectRole('admin'));
    document.getElementById('userRoleBtn')?.addEventListener('click', () => this.selectRole('user'));

    // Back buttons
    document.getElementById('backToRoles')?.addEventListener('click', () => this.showRoleSelection());
    document.getElementById('backToRolesFromSignup')?.addEventListener('click', () => this.showRoleSelection());

    // Form submissions
    this.form?.addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('signupForm')?.addEventListener('submit', (e) => this.handleSignup(e));

    // Toggle between login and signup
    document.getElementById('showAdminSignup')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showAdminSignup();
    });

    document.getElementById('showAdminLogin')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showAdminLogin();
    });
  }

  selectRole(role) {
    this.selectedRole = role;
    this.roleSelection.classList.add('hidden');
    this.loginFormContainer.classList.remove('hidden');
    document.getElementById('selectedRoleText').textContent = 
      role === 'admin' ? 'Administrator' : 'User';
  }

  showRoleSelection() {
    this.loginFormContainer.classList.add('hidden');
    this.adminSignupForm?.classList.add('hidden');
    this.roleSelection.classList.remove('hidden');
    this.form?.reset();
    document.getElementById('signupForm')?.reset();
  }

  showAdminSignup() {
    this.loginFormContainer.classList.add('hidden');
    this.adminSignupForm?.classList.remove('hidden');
  }

  showAdminLogin() {
    this.adminSignupForm?.classList.add('hidden');
    this.loginFormContainer.classList.remove('hidden');
  }

  async handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe')?.checked;

    try {
      const user = await authService.login(email, password);
      
      // Redirect based on role
      if (user.role === 'admin') {
        window.location.href = '/admin/';
      } else {
        window.location.href = '/user/';
      }
    } catch (error) {
      this.showError(error.message || 'Login failed. Please try again.');
    }
  }

  async handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('adminName').value.trim();
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    const confirmPassword = document.getElementById('adminConfirmPassword').value;

    if (password !== confirmPassword) {
      this.showError('Passwords do not match');
      return;
    }

    try {
      await authService.register({
        name,
        email,
        password,
        role: 'admin',
        isActive: true
      });
      
      // After successful registration, log the user in
      await authService.login(email, password);
      window.location.href = '/admin/';
    } catch (error) {
      this.showError(error.message || 'Registration failed. Please try again.');
    }
  }

  showError(message) {
    // Remove any existing error messages
    const existingError = document.querySelector('.alert-error');
    if (existingError) {
      existingError.remove();
    }

    // Create and show new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-error mb-4';
    errorDiv.textContent = message;
    
    // Insert error message at the top of the form
    const form = this.form || document.getElementById('signupForm');
    if (form) {
      form.prepend(errorDiv);
    }
  }
}

// Initialize the login page when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // If user is already logged in, redirect to appropriate dashboard
  if (authService.isAuthenticated()) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'admin') {
      window.location.href = '/admin/';
    } else {
      window.location.href = '/user/';
    }
  } else {
    new LoginPage();
  }
});
