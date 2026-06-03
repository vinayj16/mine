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
    return await api.get('/notices', params);
  },

  getById: async (id: string) => {
    return await api.get(`/notices/${id}`);
  },

  create: async (data: NoticeFormData) => {
    const normalizeDate = (d: string) => {
      const m = d.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
      if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
      return d;
    };
    return await api.post('/notices', {
      title: data.title,
      description: data.description,
      content: data.description,
      noticeDate: normalizeDate(data.noticeDate),
      publishDate: normalizeDate(data.publishDate),
      recipients: data.recipients,
      recipient: data.recipients.join(',') || 'all',
      priority: data.priority,
      status: data.status,
      academicYear: data.academicYear,
      institutionId: data.institutionId,
    });
  },

  update: async (id: string, data: Partial<NoticeFormData>) => {
    const normalizeDate = (d?: string) => {
      if (!d) return undefined;
      const m = d.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
      if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
      return d;
    };
    return await api.put(`/notices/${id}`, {
      title: data.title,
      description: data.description,
      content: data.description,
      noticeDate: normalizeDate(data.noticeDate),
      publishDate: normalizeDate(data.publishDate),
      recipients: data.recipients,
      recipient: data.recipients?.join(',') || 'all',
      priority: data.priority,
      status: data.status,
      academicYear: data.academicYear,
    });
  },

  delete: async (id: string) => {
    return await api.delete(`/notices/${id}`);
  },

  bulkDelete: async (noticeIds: string[]) => {
    return await api.post('/notices/bulk-delete', { noticeIds });
  },

  updateStatus: async (id: string, status: string) => {
    return await api.patch(`/notices/${id}/status`, { status });
  },

  incrementViews: async (id: string) => {
    return await api.patch(`/notices/${id}/views`);
  },

  getStatistics: async (institutionId: string, academicYear: string) => {
    return await api.get('/notices/statistics', { institutionId, academicYear });
  }
};

export default noticeService;
