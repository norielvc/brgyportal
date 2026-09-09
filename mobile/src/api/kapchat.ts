import { apiClient } from './client';

export interface ChatMessage {
  id: string;
  sender_type: 'resident' | 'admin';
  sender_name: string;
  sender_id?: string;
  message: string;
  created_at: string;
  is_read?: boolean;
}

export interface ChatThread {
  thread_id: string;
  resident_name: string;
  resident_id?: string;
  contact_number?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export const kapchatApi = {
  async getThreads(): Promise<ChatThread[]> {
    try {
      const res = await apiClient.get('/kapchat');
      // format or return threads
      if (Array.isArray(res.data)) return res.data;
      if (res.data?.data) return res.data.data;
      return [];
    } catch (e) {
      console.warn('Get chat threads error:', e);
      return [];
    }
  },

  async getMessages(threadId: string): Promise<ChatMessage[]> {
    try {
      const res = await apiClient.get(`/kapchat?thread_id=${threadId}`);
      if (Array.isArray(res.data)) return res.data;
      if (res.data?.messages) return res.data.messages;
      return [];
    } catch (e) {
      console.warn('Get chat messages error:', e);
      return [];
    }
  },

  async sendMessage(payload: {
    thread_id: string;
    message: string;
    sender_name: string;
  }) {
    const res = await apiClient.post('/kapchat', {
      ...payload,
      sender_type: 'admin',
    });
    return res.data;
  }
};
