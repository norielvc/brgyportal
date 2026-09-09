import { apiClient } from './client';

export interface CertificateItem {
  id: string;
  reference_number: string;
  tracking_code?: string;
  certificate_type: string;
  applicant_name?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  purpose: string;
  status: string; // 'pending' | 'under_review' | 'approved' | 'released' | 'rejected' | 'send_back'
  fee: number;
  or_number?: string;
  created_at: string;
  updated_at?: string;
  pickup_date?: string;
  delivery_type?: string;
  rejection_reason?: string;
  sendback_notes?: string;
  valid_id_url?: string;
  proof_of_residency_url?: string;
  contact_number?: string;
  email?: string;
  tenant_id: string;
}

export const certificatesApi = {
  async getAll(params?: { status?: string; search?: string; limit?: number; page?: number }) {
    const response = await apiClient.get('/certificates', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/certificates/${id}`);
    return response.data;
  },

  async updateStatus(id: string, payload: {
    status: string;
    action?: string;
    reason?: string;
    remarks?: string;
    orNumber?: string;
    workflowStep?: number;
  }) {
    const response = await apiClient.put(`/certificates/${id}/status`, payload);
    return response.data;
  },

  async markAsReleased(referenceNumber: string, orNumber?: string) {
    const response = await apiClient.post('/pickup/verify-ref', {
      referenceNumber,
      action: 'release',
      orNumber,
    });
    return response.data;
  }
};
