import apiService from './api';
import axios from 'axios';

const API_URL = 'commissions';

const getApiBaseUrl = (): string => {
  let base = 'http://localhost:5000';
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) {
      base = (import.meta as any).env.VITE_API_URL.replace(/\/+$/, '');
    } else if (typeof window !== 'undefined' && (window as any).ENV?.VITE_API_URL) {
      base = (window as any).ENV.VITE_API_URL.replace(/\/+$/, '');
    }
  } catch { /* empty */ }

  // Don't double-add /api/v1 if base URL already includes it
  if (/\/api\/v\d+$/i.test(base)) return base;

  const version = 'v1';
  return `${base}/api/${version}`;
};

export interface Commission {
  _id: string;
  agentId: string;
  institutionId: string;
  institutionName: string;
  institutionType: string;
  revenue: number;
  commissionRate: number;
  commissionAmount: number;
  currency: string;
  status: 'pending' | 'approved' | 'paid';
  paymentDate?: string;
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionSummary {
  totalCommission: number;
  pendingCommission: number;
  approvedCommission: number;
  paidCommission: number;
  currentMonthCommission: number;
  commissionRate: number;
}

type CommissionFilters = {
  status?: string;
  startDate?: string;
  endDate?: string;
};

const commissionService = {
  // Get commissions by agent ID
  getByAgent: async (agentId: string, filters?: CommissionFilters): Promise<Commission[]> => {
    // Return empty array if agentId is empty
    if (!agentId) {
      return [];
    }
    const params: Record<string, string> = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;

    const response = await apiService.get<Commission[]>(`commissions/agent/${agentId}`, Object.keys(params).length ? params : undefined);
    // Normalize MongoDB ObjectIds to strings
    return (response.data ?? []).map(c => ({
      ...c,
      _id: typeof c._id === 'object' && c._id !== null ? (c._id as any).toString?.() || String(c._id) : String(c._id),
      institutionId: typeof c.institutionId === 'object' && c.institutionId !== null ? (c.institutionId as any).toString?.() || String(c.institutionId) : String(c.institutionId),
      agentId: typeof c.agentId === 'object' && c.agentId !== null ? (c.agentId as any).toString?.() || String(c.agentId) : String(c.agentId),
    }));
  },

  // Get commission summary for agent
  getSummary: async (agentId: string): Promise<CommissionSummary> => {
    // Return default values if agentId is empty
    if (!agentId) {
      return {
        totalCommission: 0,
        pendingCommission: 0,
        approvedCommission: 0,
        paidCommission: 0,
        currentMonthCommission: 0,
        commissionRate: 10
      };
    }
    const response = await apiService.get<CommissionSummary>(`commissions/agent/${agentId}/summary`);
    return response.data!;
  },

  // Get commission by ID
  getById: async (id: string): Promise<Commission> => {
    const response = await apiService.get<Commission>(`${API_URL}/${id}`);
    return response.data!;
  },

  // Get all commissions (with pagination)
  getAll: async (params?: {
    agentId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{ commissions: Commission[]; pagination: any }> => {
    const queryParams: Record<string, string | number> = {};
    if (params?.agentId) queryParams.agentId = params.agentId;
    if (params?.status) queryParams.status = params.status;
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.limit !== undefined) queryParams.limit = params.limit;
    if (params?.sortBy) queryParams.sortBy = params.sortBy;
    if (params?.sortOrder) queryParams.sortOrder = params.sortOrder;

    const response = await apiService.get<{ commissions: Commission[]; pagination: any }>(API_URL, Object.keys(queryParams).length ? queryParams : undefined);
    return response.data ?? { commissions: [], pagination: {} };
  },

  // Create commission
  create: async (data: Partial<Commission>): Promise<Commission> => {
    const response = await apiService.post<Commission>(API_URL, data);
    return response.data!;
  },

  // Update commission status
  updateStatus: async (
    id: string,
    status: string,
    paymentData?: {
      paymentDate?: string;
      paymentMethod?: string;
      paymentReference?: string;
    }
  ): Promise<Commission> => {
    const response = await apiService.patch<Commission>(`${API_URL}/${id}/status`, {
      status,
      paymentData
    });
    return response.data!;
  },

  // Update commission
  update: async (id: string, data: Partial<Commission>): Promise<Commission> => {
    const response = await apiService.put<Commission>(`${API_URL}/${id}`, data);
    return response.data!;
  },

  // Delete commission
  delete: async (id: string): Promise<void> => {
    await apiService.delete<void>(`${API_URL}/${id}`);
  },

  // Download commission statement
  downloadStatement: async (agentId: string, filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    format?: 'pdf' | 'excel';
  }): Promise<void> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.format) params.append('format', filters.format);

    const query = params.toString();
    const url = `${getApiBaseUrl()}/commissions/agent/${agentId}/download${query ? '?' + query : ''}`;

    const token = localStorage.getItem('accessToken');
    const response = await axios.get(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      responseType: 'blob'
    });

    const blobUrl = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `commission-statement-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  },

  // Download commission receipt
  downloadReceipt: async (commissionId: string): Promise<void> => {
    const url = `${getApiBaseUrl()}/commissions/${commissionId}/receipt`;

    const token = localStorage.getItem('accessToken');
    const response = await axios.get(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      responseType: 'blob'
    });

    const blobUrl = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `commission-receipt-${commissionId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  }
};

export default commissionService;
