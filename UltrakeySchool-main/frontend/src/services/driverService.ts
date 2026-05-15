import apiService, { type ApiResponse } from './api';
import { API_ENDPOINTS } from '../config/api';

export interface Driver {
  id: string;
  name: string;
  email?: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  address?: string;
  dateOfBirth?: string;
  joiningDate: string;
  status: 'active' | 'inactive' | 'suspended';
  institutionId: string;
  assignedVehicle?: string;
  experience?: number;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  documents?: {
    license?: string;
    aadhar?: string;
    photo?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DriverFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateDriverInput {
  name: string;
  email?: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  address?: string;
  dateOfBirth?: string;
  joiningDate: string;
  status?: 'active' | 'inactive';
  assignedVehicle?: string;
  experience?: number;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
}

export interface UpdateDriverInput extends Partial<CreateDriverInput> {}

export interface DriverStatistics {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  withVehicles: number;
  withoutVehicles: number;
}

export interface PaginatedDriverResponse {
  drivers: Driver[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const driverService = {
  getAllDrivers: async (institutionId: string, filters?: DriverFilters): Promise<PaginatedDriverResponse> => {
    const params: Record<string, string> = { institutionId };
    
    if (filters?.page) params.page = String(filters.page);
    if (filters?.limit) params.limit = String(filters.limit);
    if (filters?.search) params.search = filters.search;
    if (filters?.status) params.status = filters.status;
    if (filters?.sortBy) params.sortBy = filters.sortBy;
    if (filters?.sortOrder) params.sortOrder = filters.sortOrder;
    
    const response: ApiResponse<PaginatedDriverResponse> = await apiService.get(
      API_ENDPOINTS.DRIVERS.LIST,
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch drivers');
    }
    
    return response.data;
  },

  getDriverById: async (id: string, institutionId: string): Promise<Driver> => {
    const response: ApiResponse<Driver> = await apiService.get(
      API_ENDPOINTS.DRIVERS.DETAIL(id),
      { institutionId }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch driver');
    }
    
    return response.data;
  },

  createDriver: async (institutionId: string, data: CreateDriverInput): Promise<Driver> => {
    const response: ApiResponse<Driver> = await apiService.post(
      API_ENDPOINTS.DRIVERS.CREATE,
      { institutionId, ...data }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create driver');
    }
    
    return response.data;
  },

  updateDriver: async (id: string, institutionId: string, data: UpdateDriverInput): Promise<Driver> => {
    const response: ApiResponse<Driver> = await apiService.put(
      API_ENDPOINTS.DRIVERS.UPDATE(id),
      { institutionId, ...data }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update driver');
    }
    
    return response.data;
  },

  deleteDriver: async (id: string, institutionId: string): Promise<void> => {
    const response: ApiResponse<void> = await apiService.delete(
      API_ENDPOINTS.DRIVERS.DELETE(id),
      { institutionId }
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete driver');
    }
  },

  bulkDeleteDrivers: async (ids: string[], institutionId: string): Promise<{ deleted: number }> => {
    const response: ApiResponse<{ deleted: number }> = await apiService.post(
      API_ENDPOINTS.DRIVERS.BULK_DELETE,
      { ids, institutionId }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to bulk delete drivers');
    }
    
    return response.data;
  },

  getActiveDrivers: async (institutionId: string): Promise<Driver[]> => {
    const response: ApiResponse<Driver[]> = await apiService.get(
      API_ENDPOINTS.DRIVERS.ACTIVE,
      { institutionId }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch active drivers');
    }
    
    return response.data;
  },

  searchDrivers: async (institutionId: string, searchTerm: string): Promise<Driver[]> => {
    const response: ApiResponse<Driver[]> = await apiService.get(
      API_ENDPOINTS.DRIVERS.SEARCH,
      { institutionId, searchTerm }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to search drivers');
    }
    
    return response.data;
  },

  getDriverStatistics: async (institutionId: string): Promise<DriverStatistics> => {
    const response: ApiResponse<DriverStatistics> = await apiService.get(
      API_ENDPOINTS.DRIVERS.STATISTICS,
      { institutionId }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch driver statistics');
    }
    
    return response.data;
  }
};

export default driverService;
