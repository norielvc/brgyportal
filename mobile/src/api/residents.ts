import { apiClient } from './client';

export interface ResidentItem {
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  alias?: string;
  birth_date?: string;
  gender?: string;
  civil_status?: string;
  contact_number?: string;
  email?: string;
  house_number?: string;
  street?: string;
  purok?: string;
  is_voter?: boolean;
  is_pwd?: boolean;
  is_senior?: boolean;
  is_4ps?: boolean;
  is_solo_parent?: boolean;
  is_head_of_family?: boolean;
  occupation?: string;
  photo_url?: string;
  national_id_number?: string;
  created_at?: string;
}

export const residentsApi = {
  async getAll(params?: { search?: string; purok?: string; limit?: number; page?: number }) {
    const response = await apiClient.get('/residents', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/residents/${id}`);
    return response.data;
  },

  async search(query: string) {
    const response = await apiClient.get('/residents', {
      params: { search: query, limit: 20 }
    });
    return response.data;
  }
};
