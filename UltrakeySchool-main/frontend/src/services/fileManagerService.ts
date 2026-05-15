import { apiClient } from '../api/client';

const API_URL = '/files';

export interface FileManagerItem {
  _id: string;
  name: string;
  type: 'file' | 'folder';
  fileType?: 'pdf' | 'doc' | 'xls' | 'img' | 'video' | 'audio' | 'other';
  icon?: string;
  size: number;
  fileCount: number;
  parentId?: string;
  ownerId: string;
  ownerName: string;
  ownerImg?: string;
  institutionId?: string;
  tags: string[];
  isFavorite: boolean;
  isShared: boolean;
  sharedWith: string[];
  permissions: 'read' | 'write' | 'admin';
  downloadUrl?: string;
  thumbnail?: string;
  metadata?: {
    dimensions?: {
      width: number;
      height: number;
    };
    duration?: number;
    pages?: number;
    description?: string;
  };
  members: Array<{
    userId: string;
    name: string;
    img?: string;
    role: 'Editor' | 'Viewer' | 'Admin';
  }>;
  color?: string;
  description?: string;
  status: 'active' | 'trash';
  deletedAt?: Date;
  createdAt: string;
  updatedAt: string;
}

export interface StorageInfo {
  totalSize: number;
  usedSize: number;
  freeSize: number;
  percentage: number;
}

export interface Statistics {
  totalFiles: number;
  totalFolders: number;
  filesByType: {
    pdf: number;
    doc: number;
    xls: number;
    img: number;
    video: number;
    audio: number;
    other: number;
  };
  totalSize: number;
}

const fileManagerService = {
  getAllItems: async (params?: { ownerId?: string; institutionId?: string; parentId?: string; type?: string; status?: string; page?: number; limit?: number }) => {
    const response = await apiClient.get(API_URL, { params });
    return response.data;
  },

  getItemById: async (id: string) => {
    const response = await apiClient.get(`${API_URL}/${id}`);
    return response.data;
  },

  createItem: async (data: Partial<FileManagerItem>) => {
    const response = await apiClient.post(API_URL, data);
    return response.data;
  },

  updateItem: async (id: string, data: Partial<FileManagerItem>) => {
    const response = await apiClient.put(`${API_URL}/${id}`, data);
    return response.data;
  },

  deleteItem: async (id: string) => {
    const response = await apiClient.delete(`${API_URL}/${id}`);
    return response.data;
  },

  moveToTrash: async (id: string) => {
    const response = await apiClient.patch(`${API_URL}/${id}/trash`);
    return response.data;
  },

  restoreItem: async (id: string) => {
    const response = await apiClient.patch(`${API_URL}/${id}/restore`);
    return response.data;
  },

  toggleFavorite: async (id: string) => {
    const response = await apiClient.patch(`${API_URL}/${id}/favorite`);
    return response.data;
  },

  shareItem: async (id: string, userIds: string[]) => {
    const response = await apiClient.post(`${API_URL}/${id}/share`, { userIds });
    return response.data;
  },

  unshareItem: async (id: string, userIds: string[]) => {
    const response = await apiClient.post(`${API_URL}/${id}/unshare`, { userIds });
    return response.data;
  },

  moveItem: async (id: string, newParentId: string | null) => {
    const response = await apiClient.post(`${API_URL}/${id}/move`, { newParentId });
    return response.data;
  },

  copyItem: async (id: string, newParentId: string | null) => {
    const response = await apiClient.post(`${API_URL}/${id}/copy`, { newParentId });
    return response.data;
  },

  getStorageInfo: async (ownerId?: string, institutionId?: string) => {
    const response = await apiClient.get(`${API_URL}/storage`, { params: { ownerId, institutionId } });
    return response.data;
  },

  getStatistics: async (ownerId?: string, institutionId?: string) => {
    const response = await apiClient.get(`${API_URL}/statistics`, { params: { ownerId, institutionId } });
    return response.data;
  },

  getRecentItems: async (ownerId?: string, institutionId?: string, days?: number) => {
    const response = await apiClient.get(`${API_URL}/recent`, { params: { ownerId, institutionId, days } });
    return response.data;
  },

  uploadFile: async (formData: FormData, onProgress?: (progress: number) => void) => {
    return apiClient.post(API_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress?.(progress);
        }
      },
    });
  },

  searchItems: async (search: string, ownerId?: string, institutionId?: string) => {
    const response = await apiClient.get(`${API_URL}/search`, { params: { search, ownerId, institutionId } });
    return response.data;
  },

  bulkDeleteItems: async (itemIds: string[]) => {
    const response = await apiClient.post(`${API_URL}/bulk/delete`, { itemIds });
    return response.data;
  }
};

export default fileManagerService;
