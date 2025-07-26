import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string || 'http://localhost:3000/api';

// Main API instance for JWT-authenticated endpoints
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only auto-logout on 401 if:
    // 1. We have a token (user was logged in)
    // 2. We're not already on login/register pages
    // 3. The error is specifically about token validation (not invalid credentials)
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath === '/login' || currentPath === '/register';
      const hasToken = localStorage.getItem('token');
      
      // Only auto-logout if user was authenticated and not on auth pages
      if (hasToken && !isAuthPage) {
        const errorCode = error.response?.data?.code;
        // Auto-logout only for token-related errors, not invalid credentials
        if (errorCode === 'AUTHENTICATION_FAILED' || errorCode === 'INVALID_TOKEN' || errorCode === 'TOKEN_EXPIRED') {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Separate API instance for resource endpoints that require API key authentication
const resourceApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add API key for resource endpoints
resourceApi.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem('apiKey');
  if (apiKey) {
    config.headers['X-API-Key'] = apiKey;
  } else {
    throw new Error('No API key available');
  }
  return config;
});

// Response interceptor for resource API
resourceApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // API key invalid or expired
      const errorMessage = error.response?.data?.message || 'API key authentication failed';
      console.error('Resource API authentication failed:', errorMessage);
    } else if (error.response?.status === 403) {
      // Insufficient permissions/scopes
      const errorMessage = error.response?.data?.message || 'Insufficient permissions for this resource';
      console.error('Resource API permission denied:', errorMessage);
    }
    return Promise.reject(error);
  }
);

export default api;
export { resourceApi };