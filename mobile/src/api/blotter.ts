import { apiClient } from './client';

export interface BlotterItem {
  id: string;
  incident_type: string;
  complainant_name: string;
  complainant_contact?: string;
  complainant_address?: string;
  respondent_name: string;
  respondent_address?: string;
  incident_date: string;
  incident_time?: string;
  incident_location: string;
  narrative: string;
  status: 'pending' | 'active' | 'under_investigation' | 'mediation_scheduled' | 'settled' | 'escalated';
  priority?: 'high' | 'medium' | 'low';
  created_at: string;
  hearing_date?: string;
  resolution_notes?: string;
  officer_assigned?: string;
  evidence_urls?: string[];
}

export const blotterApi = {
  async getAll(params?: { status?: string; search?: string; limit?: number }) {
    const response = await apiClient.get('/blotter', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/blotter?id=${id}`);
    return response.data;
  },

  async updateStatus(id: string, payload: {
    status: string;
    resolution_notes?: string;
    hearing_date?: string;
    officer_assigned?: string;
  }) {
    const response = await apiClient.put('/blotter', { id, ...payload });
    return response.data;
  },

  async create(payload: Partial<BlotterItem>) {
    const response = await apiClient.post('/blotter', payload);
    return response.data;
  }
};
