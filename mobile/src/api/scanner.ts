import { apiClient } from './client';

export interface VerificationResult {
  valid: boolean;
  type: 'certificate' | 'resident' | 'unknown';
  certificate?: {
    id: string;
    referenceNumber: string;
    type: string;
    applicantName: string;
    status: string;
    issueDate?: string;
    orNumber?: string;
    fee?: number;
    purpose?: string;
  };
  resident?: {
    id: string;
    fullName: string;
    purok?: string;
    contactNumber?: string;
    photoUrl?: string;
    voterStatus?: string;
  };
  message?: string;
}

export const scannerApi = {
  async verifyCode(rawCode: string): Promise<VerificationResult> {
    try {
      // 1. Try pickup verify endpoint
      const response = await apiClient.post('/pickup/verify-ref', {
        referenceNumber: rawCode.trim(),
      });
      if (response.data && response.data.success) {
        const cert = response.data.data;
        return {
          valid: true,
          type: 'certificate',
          certificate: {
            id: cert.id,
            referenceNumber: cert.reference_number || rawCode,
            type: cert.certificate_type || 'Barangay Document',
            applicantName: `${cert.first_name || ''} ${cert.last_name || ''}`.trim() || cert.applicant_name || 'Resident',
            status: cert.status,
            orNumber: cert.or_number,
            fee: cert.fee,
            purpose: cert.purpose,
            issueDate: cert.created_at,
          },
        };
      }
    } catch (e) {
      console.log('Direct pickup verify failed, trying fallback search...', e);
    }

    // 2. Fallback: try search in certificates by reference or tracking code
    try {
      const searchRes = await apiClient.get('/certificates', {
        params: { search: rawCode.trim(), limit: 1 }
      });
      if (searchRes.data?.data?.length > 0) {
        const cert = searchRes.data.data[0];
        return {
          valid: true,
          type: 'certificate',
          certificate: {
            id: cert.id,
            referenceNumber: cert.reference_number || cert.tracking_code || rawCode,
            type: cert.certificate_type || 'Barangay Certificate',
            applicantName: `${cert.first_name || ''} ${cert.last_name || ''}`.trim() || cert.applicant_name || 'Resident',
            status: cert.status,
            orNumber: cert.or_number,
            fee: cert.fee,
            purpose: cert.purpose,
            issueDate: cert.created_at,
          },
        };
      }
    } catch (err) {
      console.log('Search cert fallback error:', err);
    }

    return {
      valid: false,
      type: 'unknown',
      message: `No matching certificate or resident record found for "${rawCode}".`,
    };
  },

  async logScan(data: {
    scannedCode: string;
    result: 'success' | 'invalid' | 'duplicate';
    scannedBy?: string;
    notes?: string;
  }) {
    try {
      return await apiClient.post('/qr-scans', data);
    } catch (e) {
      console.warn('Failed to log scan:', e);
    }
  }
};
