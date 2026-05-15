import api from './api';

export interface CallLog {
  _id: string;
  schoolId: string;
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
  schoolId: string;
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
  getAll: async (schoolId: string) => {
    const response = await api.get(`/call-logs/schools/${schoolId}`);
    return response.data;
  },

  getByUser: async (schoolId: string, userId: string) => {
    const response = await api.get(`/call-logs/schools/${schoolId}/user/${userId}`);
    return response.data;
  },

  getById: async (schoolId: string, callId: string) => {
    const response = await api.get(`/call-logs/schools/${schoolId}/${callId}`);
    return response.data;
  },

  create: async (schoolId: string, data: Omit<CallLogFormData, 'schoolId'>) => {
    const response = await api.post(`/call-logs/schools/${schoolId}`, data);
    return response.data;
  },

  getAnalytics: async (schoolId: string) => {
    const response = await api.get(`/call-logs/schools/${schoolId}/analytics`);
    return response.data;
  }
};

export default callLogService;
