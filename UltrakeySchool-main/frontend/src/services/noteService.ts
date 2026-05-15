import axios from 'axios';
import { apiClient } from '../api/client';

const API_URL = '/notes';

export interface Note {
  _id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  tag: 'personal' | 'work' | 'social';
  status: 'active' | 'trash';
  important: boolean;
  userId: string;
  userName: string;
  userAvatar?: string;
  institutionId?: string;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    uploadedAt: Date;
  }>;
  deletedAt?: Date;
  createdAt: string;
  updatedAt: string;
}

export interface NoteStatistics {
  total: number;
  active: number;
  trash: number;
  important: number;
  byTag: {
    personal: number;
    work: number;
    social: number;
  };
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
}

const noteService = {
  getAllNotes: async (params?: { userId?: string; institutionId?: string; status?: string; tag?: string; important?: boolean; page?: number; limit?: number }) => {
    const response = await apiClient.get(API_URL, { params });
    return response.data;
  },

  getNoteById: async (id: string) => {
    const response = await apiClient.get(`${API_URL}/${id}`);
    return response.data;
  },

  createNote: async (data: Partial<Note>) => {
    const response = await apiClient.post(API_URL, data);
    return response.data;
  },

  updateNote: async (id: string, data: Partial<Note>) => {
    const response = await apiClient.put(`${API_URL}/${id}`, data);
    return response.data;
  },

  deleteNote: async (id: string) => {
    const response = await apiClient.delete(`${API_URL}/${id}`);
    return response.data;
  },

  toggleImportant: async (id: string) => {
    const response = await apiClient.patch(`${API_URL}/${id}/toggle-important`);
    return response.data;
  },

  moveToTrash: async (id: string) => {
    const response = await apiClient.patch(`${API_URL}/${id}/trash`);
    return response.data;
  },

  restoreNote: async (id: string) => {
    const response = await apiClient.patch(`${API_URL}/${id}/restore`);
    return response.data;
  },

  restoreAllNotes: async (userId?: string, institutionId?: string) => {
    const response = await apiClient.patch(`${API_URL}/restore-all`, null, { params: { userId, institutionId } });
    return response.data;
  },

  permanentDelete: async (id: string) => {
    const response = await axios.delete(`${API_URL}/${id}/permanent`);
    return response.data;
  },

  getStatistics: async (userId?: string, institutionId?: string) => {
    const response = await axios.get(`${API_URL}/statistics`, { params: { userId, institutionId } });
    return response.data;
  },

  getNotesByTag: async (userId?: string, institutionId?: string) => {
    const response = await axios.get(`${API_URL}/by-tag`, { params: { userId, institutionId } });
    return response.data;
  }
};

export default noteService;
