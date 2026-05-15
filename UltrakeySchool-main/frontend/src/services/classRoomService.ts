import apiService, { type ApiResponse } from './api';
import { API_ENDPOINTS } from '../config/api';

export interface ClassRoom {
  id?: string;
  _id?: string;
  roomNo: string;
  roomId?: string;
  capacity: number;
  building?: string;
  floor?: number;
  facilities?: string[];
  status?: 'active' | 'inactive' | 'maintenance';
  assignedClass?: string;
  assignedClassName?: string;
  currentOccupancy?: number;
  institutionId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClassRoomInput {
  roomNo: string;
  roomId?: string;
  capacity: number;
  building?: string;
  floor?: number;
  facilities?: string[];
  status?: 'active' | 'inactive' | 'maintenance';
}

export interface UpdateClassRoomInput extends Partial<CreateClassRoomInput> {
  assignedClass?: string;
  currentOccupancy?: number;
}

export interface ClassRoomFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  building?: string;
  floor?: number;
  minCapacity?: number;
  maxCapacity?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedClassRoomResponse {
  classrooms: ClassRoom[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const classRoomService = {
  async getAll(params?: ClassRoomFilters): Promise<PaginatedClassRoomResponse> {
    try {
      const queryParams: Record<string, string> = {};
      
      // Get institution ID from localStorage
      const institutionId = localStorage.getItem('schoolId') || localStorage.getItem('institutionId') || '';
      if (institutionId) {
        queryParams.institutionId = institutionId;
      }
      
      if (params?.page) queryParams.page = String(params.page);
      if (params?.limit) queryParams.limit = String(params.limit);
      if (params?.search) queryParams.search = params.search;
      if (params?.status) queryParams.status = params.status;
      if (params?.building) queryParams.building = params.building;
      if (params?.floor) queryParams.floor = String(params.floor);
      if (params?.minCapacity) queryParams.minCapacity = String(params.minCapacity);
      if (params?.maxCapacity) queryParams.maxCapacity = String(params.maxCapacity);
      if (params?.sortBy) queryParams.sortBy = params.sortBy;
      if (params?.sortOrder) queryParams.sortOrder = params.sortOrder;
      
      const response: ApiResponse<any> = await apiService.get(
        API_ENDPOINTS.CLASSROOMS.LIST,
        queryParams
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch classrooms');
      }
      
      // Handle both { data: { classrooms: [...] } } and { data: classrooms: [...] } formats
      let classrooms: ClassRoom[] = [];
      if (response.data?.classrooms) {
        classrooms = response.data.classrooms;
      } else if (Array.isArray(response.data)) {
        classrooms = response.data;
      }
      
      return {
        classrooms: classrooms,
        pagination: response.data?.pagination || {
          page: 1,
          limit: 100,
          total: classrooms.length,
          pages: 1
        }
      };
    } catch (error: unknown) {
      console.error('Error fetching classrooms:', error);
      throw error;
    }
  },

  async getById(id: string): Promise<ClassRoom> {
    try {
      const response: ApiResponse<ClassRoom> = await apiService.get(
        API_ENDPOINTS.CLASSROOMS.DETAIL(id)
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch classroom');
      }
      
      return response.data;
    } catch (error: unknown) {
      console.error('Error fetching classroom:', error);
      throw error;
    }
  },

  async create(data: CreateClassRoomInput): Promise<ClassRoom> {
    try {
      const response: ApiResponse<ClassRoom> = await apiService.post(
        API_ENDPOINTS.CLASSROOMS.CREATE,
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create classroom');
      }
      
      return response.data;
    } catch (error: unknown) {
      console.error('Error creating classroom:', error);
      throw error;
    }
  },

  async update(id: string, data: UpdateClassRoomInput): Promise<ClassRoom> {
    try {
      const response: ApiResponse<ClassRoom> = await apiService.put(
        API_ENDPOINTS.CLASSROOMS.UPDATE(id),
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update classroom');
      }
      
      return response.data;
    } catch (error: unknown) {
      console.error('Error updating classroom:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const response: ApiResponse<void> = await apiService.delete(
        API_ENDPOINTS.CLASSROOMS.DELETE(id)
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete classroom');
      }
    } catch (error: unknown) {
      console.error('Error deleting classroom:', error);
      throw error;
    }
  },

  async getStatistics(): Promise<Record<string, unknown>> {
    try {
      const response: ApiResponse<Record<string, unknown>> = await apiService.get(
        API_ENDPOINTS.CLASSROOMS.STATISTICS
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch classroom statistics');
      }
      
      return response.data;
    } catch (error: unknown) {
      console.error('Error fetching classroom statistics:', error);
      throw error;
    }
  },

  async getAvailable(): Promise<ClassRoom[]> {
    try {
      const response: ApiResponse<ClassRoom[]> = await apiService.get(
        API_ENDPOINTS.CLASSROOMS.AVAILABLE
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch available classrooms');
      }
      
      return response.data;
    } catch (error: unknown) {
      console.error('Error fetching available classrooms:', error);
      throw error;
    }
  },
};

export default classRoomService;
