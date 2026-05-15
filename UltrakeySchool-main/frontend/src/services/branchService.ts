import apiService, { type ApiResponse } from './api';

export interface Branch {
  performance: number;
  monthlyRevenue: number;
  _id: string;
  id: string;
  name: string;
  code: string;
  institutionId: string | { _id?: string; name?: string; type?: string };
  institutionName: string;
  institutionType: string;
  address: {
    street?: string;
    city: string;
    state: string;
    country?: string;
    postalCode?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    alternatePhone?: string;
  };
  branchHead?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  students: number;
  teachers?: number;
  staff?: number;
  capacity?: {
    maxStudents?: number;
    maxTeachers?: number;
    maxStaff?: number;
  };
  facilities?: string[];
  status: 'Active' | 'Suspended' | 'Inactive';
  establishedDate?: string;
  lastActivity: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// Helper to extract string value from potentially populated field
const extractString = (value: any, fallback: string = ''): string => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    // Handle populated objects like { _id: '...', name: '...', type: '...' }
    return value.name || value.fullName || value._id || fallback;
  }
  return String(value || fallback);
};

// Helper to extract ID from potentially populated field
const extractId = (value: any): string => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    return value._id || value.id || '';
  }
  return String(value || '');
};

export interface BranchStatistics {
  totalStudents: number;
  totalTeachers: number;
  totalStaff: number;
  capacity: {
    maxStudents?: number;
    maxTeachers?: number;
    maxStaff?: number;
  };
  utilizationRate: number;
  status: string;
  lastActivity: string;
}

export interface BranchesResponse {
  branches: Branch[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const branchService = {
  async createBranch(branchData: Partial<Branch>): Promise<Branch> {
    const response: ApiResponse<Branch> = await apiService.post('/branches', branchData);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create branch');
    }
    return response.data;
  },

  async getBranches(params?: {
    institutionId?: string;
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<BranchesResponse> {
    const response: ApiResponse<any> = await apiService.get('/branches', params);
    
    // The backend returns: { success: true, data: [...], branches: [...], pagination: {...} }
    // So response.data is the full object, NOT the array
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch branches');
    }
    
    // Extract branches - handle both formats
    let branchesArray = [];
    if (Array.isArray(response.data)) {
      // Direct array response
      branchesArray = response.data;
    } else if (response.data?.branches) {
      // { branches: [...] }
      branchesArray = response.data.branches;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      // { data: [...] } or { data: { branches: [...] } }
      branchesArray = response.data.data;
    } else if (Array.isArray(response.branches)) {
      // Branches at top level
      branchesArray = response.branches;
    }
    
    // Extract pagination
    const pagination = response.data?.pagination || response.pagination || { 
      page: 1, 
      limit: 50, 
      total: branchesArray.length, 
      pages: 1 
    };
    
    // Normalize branches - handle populated fields
    const normalizedBranches = branchesArray.map((branch: any) => ({
      ...branch,
      _id: branch._id || branch.id,
      id: branch.id || branch._id,
      institutionId: extractId(branch.institutionId),
      institutionName: extractString(branch.institutionName),
      institutionType: extractString(branch.institutionType),
      lastActivity: branch.lastActivity || branch.updatedAt || new Date().toISOString(),
      createdAt: branch.createdAt || new Date().toISOString(),
      updatedAt: branch.updatedAt || new Date().toISOString()
    }));
    
    return { branches: normalizedBranches, pagination };
  },

  async getBranchById(id: string): Promise<Branch> {
    const response: ApiResponse<any> = await apiService.get(`/branches/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch branch');
    }
    // Normalize the single branch
    const branch = response.data;
    return {
      ...branch,
      _id: branch._id || branch.id || id,
      id: branch.id || branch._id || id,
      institutionId: extractId(branch.institutionId),
      institutionName: extractString(branch.institutionName),
      institutionType: extractString(branch.institutionType),
      lastActivity: branch.lastActivity || branch.updatedAt || new Date().toISOString(),
      createdAt: branch.createdAt || new Date().toISOString(),
      updatedAt: branch.updatedAt || new Date().toISOString()
    };
  },

  async updateBranch(id: string, updates: Partial<Branch>): Promise<Branch> {
    const response: ApiResponse<Branch> = await apiService.put(`/branches/${id}`, updates);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update branch');
    }
    return response.data;
  },

  async deleteBranch(id: string): Promise<Branch> {
    const response: ApiResponse<Branch> = await apiService.delete(`/branches/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to delete branch');
    }
    return response.data;
  },

  async getBranchesByInstitution(institutionId: string): Promise<Branch[]> {
    const response: ApiResponse<Branch[]> = await apiService.get(`/branches/institution/${institutionId}`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch branches');
    }
    return response.data;
  },

  async getBranchesByStatus(status: string): Promise<Branch[]> {
    const response: ApiResponse<Branch[]> = await apiService.get(`/branches/status/${status}`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch branches');
    }
    return response.data;
  },

  async searchBranches(query: string, limit?: number): Promise<Branch[]> {
    const params: Record<string, string> = { q: query };
    if (limit) params.limit = String(limit);
    
    const response: ApiResponse<Branch[]> = await apiService.get('/branches/search', params);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to search branches');
    }
    return response.data;
  },

  async getBranchStatistics(id: string): Promise<BranchStatistics> {
    const response: ApiResponse<BranchStatistics> = await apiService.get(`/branches/${id}/statistics`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch statistics');
    }
    return response.data;
  },

  async updateBranchCounts(id: string, counts: { students?: number; teachers?: number; staff?: number }): Promise<Branch> {
    const response: ApiResponse<Branch> = await apiService.put(`/branches/${id}/counts`, counts);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update counts');
    }
    return response.data;
  },

  async suspendBranch(id: string, reason: string): Promise<Branch> {
    const response: ApiResponse<Branch> = await apiService.post(`/branches/${id}/suspend`, { reason });
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to suspend branch');
    }
    return response.data;
  },

  async activateBranch(id: string): Promise<Branch> {
    const response: ApiResponse<Branch> = await apiService.post(`/branches/${id}/activate`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to activate branch');
    }
    return response.data;
  },

  async addTag(id: string, tag: string): Promise<Branch> {
    const response: ApiResponse<Branch> = await apiService.post(`/branches/${id}/tags`, { tag });
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to add tag');
    }
    return response.data;
  },

  async removeTag(id: string, tag: string): Promise<Branch> {
    const response: ApiResponse<Branch> = await apiService.delete(`/branches/${id}/tags`, { tag });
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to remove tag');
    }
    return response.data;
  },

  async getBranchDashboard(): Promise<Record<string, unknown>> {
    const response: ApiResponse<Record<string, unknown>> = await apiService.get('/branches/dashboard');
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch dashboard');
    }
    return response.data;
  },

  async bulkDelete(ids: string[]): Promise<{ deleted: number; failed: number }> {
    const response: ApiResponse<{ deleted: number; failed: number }> = await apiService.post('/branches/bulk-delete', { ids });
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to bulk delete');
    }
    return response.data;
  }
};

export default branchService;
