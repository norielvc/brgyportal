import { apiClient } from './client';

export interface AdminUser {
  id: string;
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  avatar?: string;
  tenant_id: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: AdminUser;
    token: string;
    expiresIn: string;
  };
}

export const authApi = {
  async login(email: string, password: string, tenantId: string = 'ibaoeste'): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      email,
      password,
    }, {
      headers: {
        'x-tenant-id': tenantId,
      }
    });
    return response.data;
  },

  async getProfile(): Promise<{ success: boolean; data: AdminUser }> {
    const response = await apiClient.get('/user/profile');
    return response.data;
  },
};
