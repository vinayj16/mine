import apiService, { type ApiResponse } from './api';

export interface Religion {
  id: string;
  religionId?: string;
  name: string;
  status: 'active' | 'inactive';
  institutionId?: string;
  displayOrder?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReligionInput {
  name: string;
  status: 'active' | 'inactive';
  institutionId?: string;
  displayOrder?: number;
  description?: string;
}

export interface UpdateReligionInput extends Partial<CreateReligionInput> {}

export interface ReligionFilters {
  page?: number;
  limit?: number;
  search?: string;
  institutionId?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const religionService = {
  async getAll(filters: ReligionFilters = {}): Promise<PaginatedResponse<Religion>> {
    const params: Record<string, string> = {
      page: String(filters.page || 1),
      limit: String(filters.limit || 50),
    };
    
    if (filters.search) params.search = filters.search;
    if (filters.institutionId) params.institutionId = filters.institutionId;
    if (filters.status) params.status = filters.status;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;

    const response: ApiResponse<{ data: Religion[]; pagination: any }> = await apiService.get(
      'religions',
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch religions');
    }
    
    return {
      data: response.data.data,
      pagination: response.data.pagination
    };
  },

  async getById(id: string): Promise<Religion> {
    const response: ApiResponse<Religion> = await apiService.get(`religions/${id}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch religion');
    }
    
    return response.data;
  },

  async create(data: CreateReligionInput): Promise<Religion> {
    const response: ApiResponse<Religion> = await apiService.post('religions', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create religion');
    }
    
    return response.data;
  },

  async update(id: string, data: UpdateReligionInput): Promise<Religion> {
    const response: ApiResponse<Religion> = await apiService.put(`religions/${id}`, data);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update religion');
    }
    
    return response.data;
  },

  async delete(id: string): Promise<void> {
    const response: ApiResponse<void> = await apiService.delete(`religions/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete religion');
    }
  },

  async updateStatus(id: string, status: 'active' | 'inactive'): Promise<Religion> {
    const response: ApiResponse<Religion> = await apiService.patch(
      `religions/${id}/status`,
      { status }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update religion status');
    }
    
    return response.data;
  },
};

export default religionService;
