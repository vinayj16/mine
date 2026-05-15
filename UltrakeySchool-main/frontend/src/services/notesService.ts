import apiService from './api';
import { API_ENDPOINTS } from '../config/api';

export interface Note {
  _id: string;
  title: string;
  content: string;
  class_id: string;
  section_id: string;
  subject_id: string;
  attachments?: { name: string; url: string; size?: number }[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotePayload {
  title: string;
  content: string;
  class_id: string;
  section_id: string;
  subject_id: string;
  attachments?: { name: string; url: string; size?: number }[];
}

export interface NotesListResponse {
  success: boolean;
  data: Note[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface NoteResponse {
  success: boolean;
  data: Note;
}

export const notesService = {
  async list(params?: Record<string, unknown>): Promise<NotesListResponse> {
    try {
      const response = await apiService.get<NotesListResponse>(
        API_ENDPOINTS.NOTES.LIST,
        params
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch notes');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Notes Service] Failed to fetch notes:', error);
      throw error;
    }
  },

  async create(data: NotePayload): Promise<NoteResponse> {
    try {
      const response = await apiService.post<NoteResponse>(
        API_ENDPOINTS.NOTES.CREATE,
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create note');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Notes Service] Failed to create note:', error);
      throw error;
    }
  },
};

export default notesService;
