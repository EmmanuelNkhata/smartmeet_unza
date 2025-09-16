import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  verifyToken: () => api.get('/auth/verify'),
};

export const userService = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (userData) => api.put('/users/me', userData),
  changePassword: (passwords) => api.put('/users/change-password', passwords),
};

export const meetingService = {
  createMeeting: (meetingData) => api.post('/meetings', meetingData),
  getMeetings: (params) => api.get('/meetings', { params }),
  getMeeting: (id) => api.get(`/meetings/${id}`),
  updateMeeting: (id, meetingData) => api.put(`/meetings/${id}`, meetingData),
  deleteMeeting: (id) => api.delete(`/meetings/${id}`),
};

export const venueService = {
  getVenues: () => api.get('/venues'),
  getAvailableVenues: (params) => api.get('/venues/available', { params }),
};

export default api;
