import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3579/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add auth token and handle content type
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Handle Content-Type based on data type
  if (config.data instanceof FormData) {
    // For FormData, don't set Content-Type - let browser set multipart/form-data with boundary
    delete config.headers['Content-Type'];
  } else if (!config.headers['Content-Type']) {
    // For non-FormData, set JSON content type
    config.headers['Content-Type'] = 'application/json';
  }
  
  // Log requests to resources endpoint for debugging
  if (config.url?.includes('/admin/resources')) {
    console.group('🌐 API Request to Resources');
    console.log('📤 Request details:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      params: config.params,
      paramsStringified: new URLSearchParams(config.params).toString(),
      hasToken: !!token,
      headers: {
        Authorization: config.headers.Authorization ? '***PRESENT***' : 'MISSING',
        ContentType: config.headers['Content-Type']
      }
    });
    console.groupEnd();
  }
  
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only auto-logout on 401 if:
    // 1. We have a token (admin was logged in)
    // 2. We're not already on login page
    // 3. The error is specifically about token validation (not invalid credentials)
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const isLoginPage = currentPath === '/login';
      const hasToken = localStorage.getItem('adminToken');
      
      // Only auto-logout if admin was authenticated and not on login page
      if (hasToken && !isLoginPage) {
        const errorCode = error.response?.data?.code;
        // Auto-logout only for token-related errors, not invalid credentials
        if (errorCode === 'AUTHENTICATION_FAILED' || errorCode === 'INVALID_TOKEN' || errorCode === 'TOKEN_EXPIRED') {
          localStorage.removeItem('adminToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api; 