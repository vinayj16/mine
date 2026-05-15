import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// API Configuration
const getApiBaseUrl = (): string => {
  const appendApiVersion = (baseUrl: string, apiVersion: string): string => {
    const normalized = baseUrl.replace(/\/+$/, '');
    if (/\/api\/v?\d*$/i.test(normalized)) return normalized;
    const version = (apiVersion || 'v1').toString().replace(/^v/, 'v');
    return `${normalized}/api/${version}`;
  };

  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const env = (import.meta as any).env as {
        VITE_API_URL?: string;
        VITE_API_VERSION?: string;
      };

      if (env.VITE_API_URL) {
        return appendApiVersion(env.VITE_API_URL, env.VITE_API_VERSION || 'v1');
      }
    }
  } catch {
    // Fallback to runtime globals below
  }

  if (typeof window !== 'undefined' && (window as any).ENV?.VITE_API_URL) {
    const baseUrl = (window as any).ENV.VITE_API_URL;
    const apiVersion = (window as any).ENV.VITE_API_VERSION || 'v1';
    return appendApiVersion(baseUrl, apiVersion);
  }

  if (typeof globalThis !== 'undefined' && (globalThis as any).VITE_API_URL) {
    const baseUrl = (globalThis as any).VITE_API_URL;
    const apiVersion = (globalThis as any).VITE_API_VERSION || 'v1';
    return appendApiVersion(baseUrl, apiVersion);
  }

  return 'http://localhost:5000/api/v1';
};

const API_CONFIG = {
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Create axios instance
const api: AxiosInstance = axios.create(API_CONFIG);

// Request interceptor - add auth token and other headers
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // Prevent double /api/v1 when a service passes path like /api/v1/branches (baseURL already has /api/v1)
    if (config.url && /^\/api\/v\d+\/?/i.test(config.url)) {
      config.url = config.url.replace(/^\/api\/v\d+\/?/i, '/') || '/';
    }

    const headers = axios.AxiosHeaders.from(config.headers ?? {});
    headers.set('X-Request-ID', generateRequestId());
    
    // Add cache-busting headers for real-time data
    headers.set('Cache-Control', 'no-cache');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    const token = localStorage.getItem('accessToken');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    config.headers = headers;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle common response scenarios
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized - token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(
            `${API_CONFIG.baseURL}/auth/refresh-token`,
            { refreshToken }
          );

          const { accessToken } = response.data.data;

          // Store new access token
          localStorage.setItem('accessToken', accessToken);

          // Update original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          // Retry original request
          return api(originalRequest);
        }
      } catch {
        // Refresh failed - redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        window.location.href = '/login';
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      // Access forbidden
    }

    // Handle 500 Internal Server Error
    if (error.response?.status === 500) {
      // Server error
    }

    return Promise.reject(error);
  }
);

// Utility functions
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// API response types
export interface ApiResponse<T = any> {
  [x: string]: any;
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    [key: string]: any;
  };
  resetUrl?: string;
  resetToken?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// HTTP methods with proper typing
export const apiClient = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return api.get(url, config);
  },

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return api.post(url, data, config);
  },

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return api.put(url, data, config);
  },

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return api.patch(url, data, config);
  },

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return api.delete(url, config);
  },

  // Utility methods
  setAuthToken: (token: string): void => {
    localStorage.setItem('accessToken', token);
  },

  getAuthToken: (): string | null => {
    return localStorage.getItem('accessToken');
  },

  removeAuthToken: (): void => {
    localStorage.removeItem('accessToken');
  },

  setRefreshToken: (token: string): void => {
    localStorage.setItem('refreshToken', token);
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem('refreshToken');
  },

  removeRefreshToken: (): void => {
    localStorage.removeItem('refreshToken');
  },

  clearTokens: (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  // Health check
  healthCheck: (): Promise<AxiosResponse> => {
    const rootBaseUrl = API_CONFIG.baseURL.replace(/\/api\/[^/]+$/, '');
    return axios.get('/health', { baseURL: rootBaseUrl });
  }
};

export default apiClient;
