import apiService from './api';
import { API_ENDPOINTS } from '../config/api';

export interface Timetable {
  _id: string;
  class: string;
  section?: string;
  day: string;
  periods: {
    periodNumber: number;
    subject: string;
    teacher: string;
    startTime: string;
    endTime: string;
    room?: string;
  }[];
  academicYear: string;
  semester?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimetableListResponse {
  success: boolean;
  data: Timetable[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TimetableResponse {
  success: boolean;
  data: Timetable;
}

export const timetableService = {
  async getAll(params?: Record<string, unknown>): Promise<TimetableListResponse> {
    try {
      const response = await apiService.get<TimetableListResponse>(
        API_ENDPOINTS.TIMETABLE.LIST,
        params
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch timetables');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Timetable Service] Failed to fetch timetables:', error);
      throw error;
    }
  },

  async getById(id: string): Promise<TimetableResponse> {
    try {
      const response = await apiService.get<TimetableResponse>(
        API_ENDPOINTS.TIMETABLE.DETAIL(id)
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch timetable');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Timetable Service] Failed to fetch timetable:', error);
      throw error;
    }
  },

  async create(data: Partial<Timetable>): Promise<TimetableResponse> {
    try {
      const response = await apiService.post<TimetableResponse>(
        API_ENDPOINTS.TIMETABLE.CREATE,
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create timetable');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Timetable Service] Failed to create timetable:', error);
      throw error;
    }
  },

  async update(id: string, data: Partial<Timetable>): Promise<TimetableResponse> {
    try {
      const response = await apiService.put<TimetableResponse>(
        API_ENDPOINTS.TIMETABLE.UPDATE(id),
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update timetable');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Timetable Service] Failed to update timetable:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.delete<{ success: boolean; message: string }>(
        API_ENDPOINTS.TIMETABLE.DELETE(id)
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to delete timetable');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Timetable Service] Failed to delete timetable:', error);
      throw error;
    }
  },
};

export default timetableService;
