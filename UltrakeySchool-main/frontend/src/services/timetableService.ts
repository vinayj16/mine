import apiService, { type ApiResponse } from './api';
import { API_ENDPOINTS } from '../config/api';

export interface TimetablePeriod {
  _id?: string;
  periodNumber: number;
  subjectId?: string;
  teacherId?: string | { _id: string; name?: string; firstName?: string; lastName?: string; email?: string; avatar?: string };
  startTime: string;
  endTime: string;
  roomNumber?: string;
  periodType?: string;
}

export interface Timetable {
  _id: string;
  institutionId: string;
  classId: string | { _id: string; name: string; section?: string };
  sectionId?: string;
  academicYear: string;
  dayOfWeek: string;
  periods: TimetablePeriod[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const timetableService = {
  async getAll(params?: Record<string, unknown>): Promise<Timetable[]> {
    const response: ApiResponse<Timetable[]> = await apiService.get(
      API_ENDPOINTS.TIMETABLE.LIST,
      params
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch timetables');
    }
    return response.data;
  },

  async getById(id: string): Promise<Timetable> {
    const response: ApiResponse<Timetable> = await apiService.get(
      API_ENDPOINTS.TIMETABLE.DETAIL(id)
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch timetable');
    }
    return response.data;
  },

  async create(data: Record<string, unknown>): Promise<Timetable> {
    const response: ApiResponse<Timetable> = await apiService.post(
      API_ENDPOINTS.TIMETABLE.CREATE,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create timetable');
    }
    return response.data;
  },

  async update(id: string, data: Record<string, unknown>): Promise<Timetable> {
    const response: ApiResponse<Timetable> = await apiService.put(
      API_ENDPOINTS.TIMETABLE.UPDATE(id),
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update timetable');
    }
    return response.data;
  },

  async delete(id: string): Promise<void> {
    const response: ApiResponse<null> = await apiService.delete(
      API_ENDPOINTS.TIMETABLE.DELETE(id)
    );
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete timetable');
    }
  },
};

export default timetableService;
