import apiService from './api';

export interface AccountRequest {
  _id: string;
  instituteType: string;
  instituteCode: string;
  fullName: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface CreateAccountRequestData {
  instituteType: string;
  instituteCode: string;
  fullName: string;
  email: string;
  password: string;
  status: 'pending';
  submittedAt: string;
}

const accountRequestService = {
  // Create new account request
  createRequest: async (data: CreateAccountRequestData) => {
    const response = await apiService.post<AccountRequest>('/auth/create-account-request', data);
    return response;
  },

  // Get all account requests (for SuperAdmin)
  getAllRequests: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const queryParams: Record<string, any> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.sortBy) queryParams.sortBy = params.sortBy;
    if (params?.sortOrder) queryParams.sortOrder = params.sortOrder;

    const response = await apiService.get<{
      requests: AccountRequest[];
      pagination: any;
      stats: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
      };
    }>('/admin/account-requests', Object.keys(queryParams).length > 0 ? queryParams : undefined);
    
    return response.data ?? { requests: [], pagination: {}, stats: { total: 0, pending: 0, approved: 0, rejected: 0 } };
  },

  // Get single account request by ID
  getRequestById: async (id: string) => {
    const response = await apiService.get<AccountRequest>(`/admin/account-requests/${id}`);
    return response.data;
  },

  // Approve account request
  approveRequest: async (id: string, adminNotes?: string) => {
    const response = await apiService.patch<AccountRequest>(`/admin/account-requests/${id}/approve`, {
      adminNotes
    });
    return response.data;
  },

  // Reject account request
  rejectRequest: async (id: string, rejectionReason: string) => {
    const response = await apiService.patch<AccountRequest>(`/admin/account-requests/${id}/reject`, {
      rejectionReason
    });
    return response.data;
  },

  // Delete account request
  deleteRequest: async (id: string) => {
    await apiService.delete(`/admin/account-requests/${id}`);
  },

  // Get request statistics
  getStats: async () => {
    const response = await apiService.get<{
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      thisMonth: number;
      lastMonth: number;
    }>('/admin/account-requests/stats');
    return response.data ?? { total: 0, pending: 0, approved: 0, rejected: 0, thisMonth: 0, lastMonth: 0 };
  },

  // Export requests to CSV
  exportToCSV: async (params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const queryParams: Record<string, any> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;

    const response = await apiService.get('/admin/account-requests/export/csv', 
      Object.keys(queryParams).length > 0 ? queryParams : undefined
    );
    return response.data;
  }
};

export default accountRequestService;
