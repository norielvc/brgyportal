import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api').replace(/\/$/, '').replace(/\/api$/, '') + '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and tenant ID
api.interceptors.request.use(
  (config) => {
    // 1. Send the Auth Token
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 2. Send the Tenant ID for Multi-Tenant Architecture
    let tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
    if (typeof window !== 'undefined' && !tenantId) {
      if (window.location.hostname.includes('demo')) {
        tenantId = 'demo';
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        const tenantParam = urlParams.get('tenant');
        if (tenantParam) {
          localStorage.setItem('tenant_override', tenantParam);
          tenantId = tenantParam;
        } else {
          tenantId = localStorage.getItem('tenant_override');
        }
      }
    }
    config.headers['x-tenant-id'] = tenantId || 'ibaoeste';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;

    if (response) {
      const { status, data } = response;

      // Handle authentication errors
      if (status === 401) {
        Cookies.remove('token');
        Cookies.remove('user');

        // Only redirect if not already on login page
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }

        toast.error('Session expired. Please login again.');
        return Promise.reject(error);
      }

      // Handle other HTTP errors
      const message = data?.message || `HTTP Error ${status}`;

      if (status >= 500) {
        toast.error('Server error. Please try again later.');
      } else if (status === 403) {
        toast.error('Access denied. Insufficient permissions.');
      } else if (status === 404) {
        toast.error('Resource not found.');
      } else {
        toast.error(message);
      }
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please check your connection.');
    } else if (error.message === 'Network Error') {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred.');
    }

    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },
};

// Users API functions
export const usersAPI = {
  getUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getUser: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  getUserStats: async () => {
    const response = await api.get('/users/stats/overview');
    return response.data;
  },
};

// Dashboard API functions
export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getAnalytics: async (period = '30d') => {
    const response = await api.get('/dashboard/analytics', {
      params: { period }
    });
    return response.data;
  },
};

// Certificates API functions
export const certificatesAPI = {
  getRequests: async (params = {}) => {
    const response = await api.get('/certificates', { params });
    return response.data;
  },

  getRequest: async (id) => {
    const response = await api.get(`/certificates/${id}`);
    return response.data;
  },

  getRequestByReference: async (refNumber) => {
    const response = await api.get(`/certificates/reference/${refNumber}`);
    return response.data;
  },

  getWorkflowHistory: async (requestId) => {
    const response = await api.get(`/workflow-assignments/history/${requestId}`);
    return response.data;
  },
};

export default api;// Trigger build 1
