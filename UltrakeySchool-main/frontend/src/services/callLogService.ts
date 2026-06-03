import api from './api';

export interface CallLog {
  _id: string;
  institutionId: string;
  callerId: string;
  callerName?: string;
  callerRole?: string;
  receiverId?: string;
  receiverName?: string;
  receiverRole?: string;
  receiverPhone?: string;
  callType: 'outgoing' | 'incoming' | 'missed' | 'voicemail';
  direction: 'inbound' | 'outbound';
  duration: number;
  status: 'completed' | 'failed' | 'busy' | 'no_answer' | 'cancelled';
  notes?: string;
  callDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CallLogFormData {
  institutionId: string;
  callerId: string;
  callerName?: string;
  callerRole?: string;
  receiverId?: string;
  receiverName?: string;
  receiverRole?: string;
  receiverPhone?: string;
  callType: string;
  direction: string;
  duration: number;
  status: string;
  notes?: string;
  callDate?: string;
}

const callLogService = {
  getAll: async (institutionId: string) => {
    const response = await api.get(`/call-logs/institutions/${institutionId}`);
    return response.data;
  },

  getByUser: async (institutionId: string, userId: string) => {
    const response = await api.get(`/call-logs/institutions/${institutionId}/users/${userId}`);
    return response.data;
  },

  getById: async (institutionId: string, callId: string) => {
    const response = await api.get(`/call-logs/institutions/${institutionId}/${callId}`);
    return response.data;
  },

  create: async (institutionId: string, data: Omit<CallLogFormData, 'institutionId'>) => {
    const response = await api.post(`/call-logs/institutions/${institutionId}`, data);
    return response.data;
  },

  getAnalytics: async (institutionId: string) => {
    const response = await api.get(`/call-logs/institutions/${institutionId}/analytics`);
    return response.data;
  }
};

export default callLogService;
