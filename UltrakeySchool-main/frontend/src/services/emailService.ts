import { apiClient } from '../api/client';

const API_URL = '/emails';

export interface Email {
  _id: string;
  threadId?: string;
  sender: {
    userId: string;
    name: string;
    email: string;
    avatar?: string;
  };
  recipients: Array<{
    userId?: string;
    name?: string;
    email: string;
    type: 'to' | 'cc' | 'bcc';
  }>;
  subject: string;
  content: string;
  htmlContent?: string;
  preview?: string;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  hasAttachment: boolean;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
    thumbnail?: string;
    inline?: boolean;
    uploadedAt: Date;
  }>;
  folder: 'inbox' | 'sent' | 'drafts' | 'archive' | 'trash' | 'spam' | 'important';
  tags: string[];
  labels: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  size: number;
  isEncrypted: boolean;
  isSigned: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'failed' | 'draft';
  scheduledFor?: Date;
  repliedTo?: string;
  forwardedFrom?: string;
  category: 'primary' | 'social' | 'promotions' | 'updates' | 'forums';
  userId: string;
  institutionId?: string;
  readAt?: Date;
  deletedAt?: Date;
  createdAt: string;
  updatedAt: string;
}

const emailService = {
  getAllEmails: async (params?: { userId?: string; institutionId?: string; folder?: string; page?: number; limit?: number }) => {
    const response = await apiClient.get(API_URL, { params });
    return response.data;
  },

  getEmailById: async (id: string) => {
    const response = await apiClient.get(`${API_URL}/${id}`);
    return response.data;
  },

  createEmail: async (data: Partial<Email>) => {
    const response = await apiClient.post(API_URL, data);
    return response.data;
  },

  updateEmail: async (id: string, data: Partial<Email>) => {
    const response = await apiClient.put(`${API_URL}/${id}`, data);
    return response.data;
  },

  deleteEmail: async (id: string) => {
    const response = await apiClient.delete(`${API_URL}/${id}`);
    return response.data;
  },

  sendEmail: async (data: Partial<Email>) => {
    const response = await apiClient.post(API_URL, data);
    return response.data;
  },

  saveDraft: async (data: Partial<Email>) => {
    const response = await apiClient.post(API_URL, { ...data, folder: 'drafts', status: 'draft' });
    return response.data;
  },

  markAsRead: async (id: string | string[], isRead: boolean) => {
    if (Array.isArray(id)) {
      const results = [];
      for (const singleId of id) {
        try {
          const res = await apiClient.patch(`${API_URL}/${singleId}/read`, { isRead });
          results.push(res.data);
        } catch (err) {
          console.error(`Failed to mark email ${singleId} as read:`, err);
        }
      }
      return { success: true, data: results };
    }
    const response = await apiClient.patch(`${API_URL}/${id}/read`, { isRead });
    return response.data;
  },

  toggleStar: async (id: string) => {
    const email = await apiClient.get(`${API_URL}/${id}`);
    const current = email.data?.data?.isStarred || false;
    const response = await apiClient.patch(`${API_URL}/${id}/star`, { isStarred: !current });
    return response.data;
  },

  toggleImportant: async (id: string) => {
    const email = await apiClient.get(`${API_URL}/${id}`);
    const current = email.data?.data?.isImportant || false;
    const response = await apiClient.patch(`${API_URL}/${id}/important`, { isImportant: !current });
    return response.data;
  },

  moveToFolder: async (id: string | string[], folder: string) => {
    if (Array.isArray(id)) {
      const results = [];
      for (const singleId of id) {
        try {
          const res = await apiClient.patch(`${API_URL}/${singleId}/move`, { folder });
          results.push(res.data);
        } catch (err) {
          console.error(`Failed to move email ${singleId}:`, err);
        }
      }
      return { success: true, data: results };
    }
    const response = await apiClient.patch(`${API_URL}/${id}/move`, { folder });
    return response.data;
  },

  bulkMoveToFolder: async (ids: string[], folder: string) => {
    const results = [];
    for (const id of ids) {
      try {
        const res = await apiClient.patch(`${API_URL}/${id}/move`, { folder });
        results.push(res.data);
      } catch (err) {
        console.error(`Failed to move email ${id}:`, err);
      }
    }
    return { success: true, data: results };
  },

  bulkDelete: async (ids: string[]) => {
    return emailService.bulkMoveToFolder(ids, 'trash');
  },

  permanentDelete: async (ids: string[]) => {
    const results = [];
    for (const id of ids) {
      try {
        const res = await apiClient.delete(`${API_URL}/${id}`);
        results.push(res.data);
      } catch (err) {
        console.error(`Failed to permanently delete email ${id}:`, err);
      }
    }
    return { success: true, data: results };
  },

  emptyTrash: async (userId?: string) => {
    const params: Record<string, any> = { folder: 'trash', limit: 100 };
    if (userId) params.userId = userId;
    const response = await apiClient.get(API_URL, { params });
    const trashEmails = response.data?.data || [];
    const ids = trashEmails.map((e: any) => e._id);
    return emailService.permanentDelete(ids);
  },

  getStatistics: async (userId?: string, institutionId?: string) => {
    const response = await apiClient.get(`${API_URL}/statistics`, { params: { userId, institutionId } });
    return response.data;
  },

  searchEmails: async (search: string, userId?: string, institutionId?: string) => {
    const response = await apiClient.get(API_URL, { params: { search, userId, institutionId } });
    return response.data;
  },

  getRecentEmails: async (userId?: string, institutionId?: string) => {
    const response = await apiClient.get(API_URL, { params: { userId, institutionId, limit: 10 } });
    return response.data;
  },

  getEmailsByThread: async (threadId: string) => {
    const response = await apiClient.get(API_URL, { params: { threadId } });
    return response.data;
  }
};

export default emailService;
