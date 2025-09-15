// Authentication service for handling user sessions and API calls

const API_BASE_URL = '/api';

class AuthService {
  constructor() {
    this.user = null;
    this.token = localStorage.getItem('authToken') || null;
    this.loadUser();
  }

  async loadUser() {
    if (this.token) {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        });
        
        if (response.ok) {
          this.user = await response.json();
          return this.user;
        } else {
          this.clearAuth();
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        this.clearAuth();
      }
    }
    return null;
  }

  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      this.token = data.token;
      this.user = data.user;
      
      // Store token and user data
      localStorage.setItem('authToken', this.token);
      localStorage.setItem('user', JSON.stringify(this.user));
      
      return this.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      return data.user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  logout() {
    this.clearAuth();
    window.location.href = '/auth/login.html';
  }

  clearAuth() {
    this.user = null;
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  isAuthenticated() {
    return !!this.token;
  }

  hasRole(role) {
    return this.user?.role === role;
  }

  getAuthHeader() {
    return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
  }
}

export const authService = new AuthService();
