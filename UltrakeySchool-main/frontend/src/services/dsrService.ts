import apiService, { type ApiResponse } from './api';
import { API_ENDPOINTS } from '../config/api';

// Types
export interface DataExportRequest {
  id: string;
  userId: string;
  institutionId: string;
  requestType: 'full' | 'partial' | 'specific';
  requestedData: string[];
  format: 'json' | 'csv' | 'pdf';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  expiresAt: string;
  processedAt?: string;
  processedBy?: string;
  reason?: string;
  verificationToken: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataErasureRequest {
  id: string;
  userId: string;
  institutionId: string;
  requestType: 'partial' | 'full';
  requestedData: string[];
  reason: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'completed' | 'failed';
  reviewedAt?: string;
  reviewedBy?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectedReason?: string;
  completedAt?: string;
  gracePeriodEndsAt: string;
  verificationToken: string;
  verifiedAt?: string;
  dataBackup?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  institutionId: string;
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DataExportRequestInput {
  requestType?: 'full' | 'partial' | 'specific';
  requestedData?: string[];
  format?: 'json' | 'csv' | 'pdf';
}

export interface DataErasureRequestInput {
  requestType?: 'partial' | 'full';
  requestedData?: string[];
  reason: string;
}

export interface VerifyRequestInput {
  verificationToken: string;
}

export interface CompleteExportInput {
  fileUrl: string;
}

export interface ReviewErasureInput {
  approved: boolean;
  reason?: string;
}

export interface CompleteErasureInput {
  dataBackup?: string;
}

export interface DsrFilters {
  status?: string;
  limit?: number;
  userId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface DataRetentionCompliance {
  compliant: boolean;
  message: string;
  retentionPeriods: {
    studentData: number;
    staffData: number;
    auditLogs: number;
  };
}

export interface MyDataRequests {
  exportRequests: DataExportRequest[];
  erasureRequests: DataErasureRequest[];
}

// API Functions
export const dsrService = {
  // Data Export Methods
  async createDataExportRequest(data: DataExportRequestInput): Promise<DataExportRequest> {
    const response: ApiResponse<DataExportRequest> = await apiService.post(
      API_ENDPOINTS.DSR.DATA_EXPORT,
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create data export request');
    }
    
    return response.data;
  },

  async getDataExportRequests(filters: DsrFilters = {}): Promise<DataExportRequest[]> {
    const params: Record<string, string> = {};
    if (filters.status) params.status = filters.status;
    if (filters.limit) params.limit = String(filters.limit);
    if (filters.userId) params.userId = filters.userId;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    
    const response: ApiResponse<DataExportRequest[]> = await apiService.get(
      API_ENDPOINTS.DSR.DATA_EXPORT,
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch data export requests');
    }
    
    return response.data;
  },

  async verifyDataExportRequest(requestId: string, data: VerifyRequestInput): Promise<DataExportRequest> {
    const response: ApiResponse<DataExportRequest> = await apiService.post(
      API_ENDPOINTS.DSR.VERIFY_DATA_EXPORT(requestId),
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to verify data export request');
    }
    
    return response.data;
  },

  async completeDataExportRequest(requestId: string, data: CompleteExportInput): Promise<DataExportRequest> {
    const response: ApiResponse<DataExportRequest> = await apiService.post(
      API_ENDPOINTS.DSR.COMPLETE_DATA_EXPORT(requestId),
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to complete data export request');
    }
    
    return response.data;
  },

  // Data Erasure Methods
  async createDataErasureRequest(data: DataErasureRequestInput): Promise<DataErasureRequest> {
    const response: ApiResponse<DataErasureRequest> = await apiService.post(
      API_ENDPOINTS.DSR.DATA_ERASURE,
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create data erasure request');
    }
    
    return response.data;
  },

  async getDataErasureRequests(filters: DsrFilters = {}): Promise<DataErasureRequest[]> {
    const params: Record<string, string> = {};
    if (filters.status) params.status = filters.status;
    if (filters.limit) params.limit = String(filters.limit);
    if (filters.userId) params.userId = filters.userId;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    
    const response: ApiResponse<DataErasureRequest[]> = await apiService.get(
      API_ENDPOINTS.DSR.DATA_ERASURE,
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch data erasure requests');
    }
    
    return response.data;
  },

  async verifyDataErasureRequest(requestId: string, data: VerifyRequestInput): Promise<DataErasureRequest> {
    const response: ApiResponse<DataErasureRequest> = await apiService.post(
      API_ENDPOINTS.DSR.VERIFY_DATA_ERASURE(requestId),
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to verify data erasure request');
    }
    
    return response.data;
  },

  async reviewDataErasureRequest(requestId: string, data: ReviewErasureInput): Promise<DataErasureRequest> {
    const response: ApiResponse<DataErasureRequest> = await apiService.post(
      API_ENDPOINTS.DSR.REVIEW_DATA_ERASURE(requestId),
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to review data erasure request');
    }
    
    return response.data;
  },

  async completeDataErasureRequest(requestId: string, data: CompleteErasureInput): Promise<DataErasureRequest> {
    const response: ApiResponse<DataErasureRequest> = await apiService.post(
      API_ENDPOINTS.DSR.COMPLETE_DATA_ERASURE(requestId),
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to complete data erasure request');
    }
    
    return response.data;
  },

  // Audit Log Methods
  async getAuditLogs(filters: DsrFilters = {}): Promise<AuditLog[]> {
    const params: Record<string, string> = {};
    if (filters.limit) params.limit = String(filters.limit);
    if (filters.userId) params.userId = filters.userId;
    if (filters.action) params.action = filters.action;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    
    const response: ApiResponse<AuditLog[]> = await apiService.get(
      API_ENDPOINTS.DSR.AUDIT_LOGS,
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch audit logs');
    }
    
    return response.data;
  },

  // Data Retention Methods
  async checkDataRetentionCompliance(): Promise<DataRetentionCompliance> {
    const response: ApiResponse<DataRetentionCompliance> = await apiService.get(
      API_ENDPOINTS.DSR.DATA_RETENTION_COMPLIANCE
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to check data retention compliance');
    }
    
    return response.data;
  },

  // Helper methods for user convenience
  async exportMyData(format: 'json' | 'csv' | 'pdf' = 'json'): Promise<DataExportRequest> {
    return this.createDataExportRequest({
      requestType: 'full',
      requestedData: ['all'],
      format
    });
  },

  async eraseMyData(reason: string): Promise<DataErasureRequest> {
    return this.createDataErasureRequest({
      requestType: 'full',
      requestedData: ['personal'],
      reason
    });
  },

  async getMyDataRequests(): Promise<MyDataRequests> {
    const [exportRequests, erasureRequests] = await Promise.all([
      this.getDataExportRequests(),
      this.getDataErasureRequests()
    ]);

    return {
      exportRequests,
      erasureRequests
    };
  },

  async downloadExportFile(fileUrl: string): Promise<Blob> {
    const response: ApiResponse<Blob> = await apiService.get(fileUrl);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to download export file');
    }
    
    return response.data;
  }
};

export default dsrService;