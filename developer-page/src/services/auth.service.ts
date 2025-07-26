import api from './api';

export interface Developer {
  id: string;
  email: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  developer: Developer;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

const AuthService = {
  // Register new developer
  register: async (data: RegisterRequest): Promise<{ developer: Developer; verificationToken: string }> => {
    const response = await api.post('/developer/register', data);
    return response.data.data;
  },

  // Login developer
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/developer/auth/login', data);
    return response.data.data;
  },

  // Logout developer
  logout: async (): Promise<void> => {
    await api.post('/developer/auth/logout');
  },

  // Get current developer profile
  getProfile: async (): Promise<Developer> => {
    const response = await api.get('/developer/auth/profile');
    return response.data.data;
  },

  // Verify email
  verifyEmail: async (email: string): Promise<Developer> => {
    const response = await api.post('/developer/verify', { email });
    return response.data.data;
  },
};

export default AuthService;