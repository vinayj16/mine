import api from './api';

export interface Notice {
  _id: string;
  noticeId: string;
  title: string;
  description: string;
  noticeDate: string;
  publishDate: string;
  recipients: string[];
  attachments?: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
    uploadedAt: string;
  }[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'published' | 'archived';
  academicYear: string;
  institutionId: string;
  views: number;
  metadata?: {
    createdBy: string;
    updatedBy?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NoticeFormData {
  title: string;
  description: string;
  noticeDate: string;
  publishDate: string;
  recipients: string[];
  priority: string;
  status: string;
  academicYear: string;
  institutionId: string;
}

const noticeService = {
  getAll: async (params?: {
    institutionId?: string;
    academicYear?: string;
    status?: string;
    priority?: string;
    recipient?: string;
  }) => {
    const response = await api.get('/notices', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/notices/${id}`);
    return response.data;
  },

  create: async (data: NoticeFormData) => {
    const response = await api.post('/notices', data);
    return response.data;
  },

  update: async (id: string, data: Partial<NoticeFormData>) => {
    const response = await api.put(`/notices/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/notices/${id}`);
    return response.data;
  },

  bulkDelete: async (noticeIds: string[]) => {
    const response = await api.post('/notices/bulk-delete', { noticeIds });
    return response.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/notices/${id}/status`, { status });
    return response.data;
  },

  incrementViews: async (id: string) => {
    const response = await api.patch(`/notices/${id}/views`);
    return response.data;
  },

  getStatistics: async (institutionId: string, academicYear: string) => {
    const response = await api.get('/notices/statistics', {
      params: { institutionId, academicYear }
    });
    return response.data;
  }
};

export default noticeService;
