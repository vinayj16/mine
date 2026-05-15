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
    const response = await apiClient.post(`${API_URL}/send`, data);
    return response.data;
  },

  saveDraft: async (data: Partial<Email>) => {
    const response = await apiClient.post(`${API_URL}/draft`, data);
    return response.data;
  },

  scheduleEmail: async (data: Partial<Email>) => {
    const response = await apiClient.post(`${API_URL}/schedule`, data);
    return response.data;
  },

  replyToEmail: async (id: string, data: Partial<Email>) => {
    const response = await apiClient.post(`${API_URL}/${id}/reply`, data);
    return response.data;
  },

  forwardEmail: async (id: string, data: Partial<Email>) => {
    const response = await apiClient.post(`${API_URL}/${id}/forward`, data);
    return response.data;
  },

  markAsRead: async (ids: string[], isRead: boolean) => {
    const response = await apiClient.post(`${API_URL}/mark-read`, { ids, isRead });
    return response.data;
  },

  toggleStar: async (id: string) => {
    const response = await apiClient.patch(`${API_URL}/${id}/star`);
    return response.data;
  },

  toggleImportant: async (id: string) => {
    const response = await apiClient.patch(`${API_URL}/${id}/important`);
    return response.data;
  },

  moveToFolder: async (ids: string[], folder: string) => {
    const response = await apiClient.post(`${API_URL}/move-folder`, { ids, folder });
    return response.data;
  },

  addTags: async (id: string, tags: string[]) => {
    const response = await apiClient.post(`${API_URL}/${id}/tags`, { tags });
    return response.data;
  },

  removeTags: async (id: string, tags: string[]) => {
    const response = await apiClient.delete(`${API_URL}/${id}/tags`, { data: { tags } });
    return response.data;
  },

  addLabels: async (id: string, labels: string[]) => {
    const response = await apiClient.post(`${API_URL}/${id}/labels`, { labels });
    return response.data;
  },

  removeLabels: async (id: string, labels: string[]) => {
    const response = await apiClient.delete(`${API_URL}/${id}/labels`, { data: { labels } });
    return response.data;
  },

  bulkDelete: async (ids: string[]) => {
    const response = await apiClient.post(`${API_URL}/bulk/delete`, { ids });
    return response.data;
  },

  permanentDelete: async (ids: string[]) => {
    const response = await apiClient.post(`${API_URL}/bulk/permanent-delete`, { ids });
    return response.data;
  },

  emptyTrash: async (userId?: string, institutionId?: string) => {
    const response = await apiClient.delete(`${API_URL}/trash/empty`, { params: { userId, institutionId } });
    return response.data;
  },

  getStatistics: async (userId?: string, institutionId?: string) => {
    const response = await apiClient.get(`${API_URL}/statistics`, { params: { userId, institutionId } });
    return response.data;
  },

  searchEmails: async (search: string, userId?: string, institutionId?: string) => {
    const response = await apiClient.get(`${API_URL}/search`, { params: { search, userId, institutionId } });
    return response.data;
  },

  getRecentEmails: async (userId?: string, institutionId?: string, days?: number) => {
    const response = await apiClient.get(`${API_URL}/recent`, { params: { userId, institutionId, days } });
    return response.data;
  },

  getEmailsByThread: async (threadId: string) => {
    const response = await apiClient.get(`${API_URL}/thread/${threadId}`);
    return response.data;
  }
};

export default emailService;
