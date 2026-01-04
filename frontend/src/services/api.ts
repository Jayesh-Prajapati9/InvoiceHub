import axios, { AxiosError } from 'axios';

// Use relative URL to leverage Vite proxy in development
// In production, use VITE_API_URL environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Store toast function reference (will be set by app initialization)
let toastHandler: ((message: string, type: 'success' | 'error' | 'info' | 'warning') => void) | null = null;

// Function to set toast handler from app
export const setToastHandler = (handler: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void) => {
  toastHandler = handler;
};

// Helper to get error message from API response
const getErrorMessage = (error: AxiosError): string => {
  if (error.response?.data) {
    const data = error.response.data as any;
    if (data.error?.message) {
      return data.error.message;
    }
    if (data.message) {
      return data.message;
    }
    if (data.error?.details && Array.isArray(data.error.details)) {
      return data.error.details.map((d: any) => d.message || d).join(', ');
    }
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Request interceptor to add auth token
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      if (toastHandler) {
        toastHandler('Session expired. Please login again.', 'error');
      }
    } else if (!error.response) {
      // Network error or no response - show toast as these are usually unhandled
      if (toastHandler) {
        toastHandler('Network error. Please check your connection.', 'error');
      }
    }
    // For 400+ errors, don't show toast here - let mutations/queries handle their own errors
    // This prevents duplicate toasts when mutations have onError handlers
    return Promise.reject(error);
  }
);

export default api;

