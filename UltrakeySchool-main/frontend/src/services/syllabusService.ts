import apiService from './api';
import { API_ENDPOINTS } from '../config/api';
import type { ApiResponse } from './api';

export interface Topic {
  _id?: string;
  name: string;
  description?: string;
  duration?: number;
  order?: number;
  isCompleted?: boolean;
  completedDate?: Date;
}

export interface Syllabus {
  _id: string;
  schoolId: string;
  classId: string;
  subjectId: string;
  academicYear: string;
  term: '1' | '2' | '3' | 'annual';
  title: string;
  description?: string;
  objectives?: string[];
  topics?: Topic[];
  totalHours?: number;
  textbook?: string;
  referenceBooks?: string[];
  status: 'draft' | 'active' | 'archived';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSyllabusInput {
  classId: string;
  subjectId: string;
  academicYear: string;
  term: '1' | '2' | '3' | 'annual';
  title: string;
  description?: string;
  objectives?: string[];
  topics?: Topic[];
  totalHours?: number;
  textbook?: string;
  referenceBooks?: string[];
  status?: 'draft' | 'active' | 'archived';
}

export interface UpdateSyllabusInput extends Partial<CreateSyllabusInput> {}

export interface SyllabusFilters {
  classId?: string;
  subjectId?: string;
  academicYear?: string;
  term?: string;
  page?: number;
  limit?: number;
}

const syllabusService = {
  async getAll(schoolId: string, filters?: SyllabusFilters): Promise<Syllabus[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.classId) queryParams.append('classId', filters.classId);
      if (filters?.subjectId) queryParams.append('subjectId', filters.subjectId);
      if (filters?.academicYear) queryParams.append('academicYear', filters.academicYear);
      if (filters?.term) queryParams.append('term', filters.term);
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());

      const queryString = queryParams.toString();
      const url = `${API_ENDPOINTS.SYLLABI.replace(':schoolId', schoolId)}${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiService.get<ApiResponse<{ syllabi: Syllabus[]; total: number }>>(url);
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch syllabi');
      }
      
      // Handle nested response structure { syllabi: [], total: 0 }
      const syllabiArray = response.data.syllabi || response.data || [];
      return syllabiArray as Syllabus[];
    } catch (error) {
      console.error('Error fetching syllabi:', error);
      throw error;
    }
  },

  async getById(schoolId: string, syllabusId: string): Promise<Syllabus> {
    try {
      const response = await apiService.get<ApiResponse<Syllabus>>(
        `${API_ENDPOINTS.SYLLABI.replace(':schoolId', schoolId)}/${syllabusId}`
      );
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch syllabus');
      }
      
      return response.data as unknown as Syllabus;
    } catch (error) {
      console.error('Error fetching syllabus:', error);
      throw error;
    }
  },

  async getByClass(schoolId: string, classId: string): Promise<Syllabus[]> {
    try {
      const response = await apiService.get<ApiResponse<Syllabus[]>>(
        `${API_ENDPOINTS.SYLLABI.replace(':schoolId', schoolId)}/class/${classId}`
      );
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch syllabi by class');
      }
      
      return response.data as unknown as Syllabus[];
    } catch (error) {
      console.error('Error fetching syllabi by class:', error);
      throw error;
    }
  },

  async create(schoolId: string, data: CreateSyllabusInput): Promise<Syllabus> {
    try {
      const response = await apiService.post<ApiResponse<Syllabus>>(
        API_ENDPOINTS.SYLLABI.replace(':schoolId', schoolId),
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error('Failed to create syllabus');
      }
      
      return response.data as unknown as Syllabus;
    } catch (error) {
      console.error('Error creating syllabus:', error);
      throw error;
    }
  },

  async update(schoolId: string, syllabusId: string, data: UpdateSyllabusInput): Promise<Syllabus> {
    try {
      const response = await apiService.put<ApiResponse<Syllabus>>(
        `${API_ENDPOINTS.SYLLABI.replace(':schoolId', schoolId)}/${syllabusId}`,
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error('Failed to update syllabus');
      }
      
      return response.data as unknown as Syllabus;
    } catch (error) {
      console.error('Error updating syllabus:', error);
      throw error;
    }
  },

  async delete(schoolId: string, syllabusId: string): Promise<void> {
    try {
      const response = await apiService.delete<ApiResponse<void>>(
        `${API_ENDPOINTS.SYLLABI.replace(':schoolId', schoolId)}/${syllabusId}`
      );
      
      if (!response.success) {
        throw new Error('Failed to delete syllabus');
      }
    } catch (error) {
      console.error('Error deleting syllabus:', error);
      throw error;
    }
  },

  async markTopicComplete(
    schoolId: string,
    syllabusId: string,
    topicId: string,
    isCompleted: boolean
  ): Promise<Syllabus> {
    try {
      const response = await apiService.patch<ApiResponse<Syllabus>>(
        `${API_ENDPOINTS.SYLLABI.replace(':schoolId', schoolId)}/${syllabusId}/topic`,
        { topicId, isCompleted }
      );
      
      if (!response.success || !response.data) {
        throw new Error('Failed to mark topic complete');
      }
      
      return response.data as unknown as Syllabus;
    } catch (error) {
      console.error('Error marking topic complete:', error);
      throw error;
    }
  },
};

export default syllabusService;
