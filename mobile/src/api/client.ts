import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { storage } from '../utils/storage';

export const DEFAULT_API_BASE = 'http://localhost:3000/api';
// Default LAN IP for physical device testing or Android Emulator fallback:
// Android Emulator uses 10.0.2.2 to access host localhost

let currentBaseUrl = DEFAULT_API_BASE;
let currentTenantId = 'ibaoeste';

export const setApiBaseUrl = (url: string) => {
  currentBaseUrl = url.replace(/\/+$/, '');
  apiClient.defaults.baseURL = currentBaseUrl;
};

export const getApiBaseUrl = () => currentBaseUrl;

export const setTenantId = (tenant: string) => {
  currentTenantId = tenant;
};

export const getTenantId = () => currentTenantId;

export const apiClient: AxiosInstance = axios.create({
  baseURL: currentBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor: attach token & tenant headers
apiClient.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem('admin_token');
    const tenant = (await storage.getItem('admin_tenant')) || currentTenantId;

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    if (tenant) {
      config.headers['x-tenant-id'] = tenant;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle session expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('API 401 Unauthorized: Session may be expired.');
    }
    return Promise.reject(error);
  }
);
