import apiService from './api';
import { API_ENDPOINTS } from '../config/api';

export interface TransportReport {
  _id: string;
  institutionId: string;
  reportType: string;
  title: string;
  description?: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  data: Record<string, unknown>;
  generatedBy: string;
  generatedAt: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt?: string;
  updatedAt?: string;
}

export interface TransportReportFilters {
  page?: number;
  limit?: number;
  search?: string;
  reportType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface TransportReportListResponse {
  success: boolean;
  data: TransportReport[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TransportReportResponse {
  success: boolean;
  data: TransportReport;
}

export interface TransportStatistics {
  totalRoutes: number;
  totalVehicles: number;
  totalStudents: number;
  activeAssignments: number;
  byRoute: { route: string; count: number }[];
  byVehicle: { vehicle: string; count: number }[];
}

export const transportReportService = {
  getAllReports: async (institutionId: string, filters?: TransportReportFilters): Promise<TransportReportListResponse> => {
    try {
      const response = await apiService.get<TransportReportListResponse>(
        API_ENDPOINTS.TRANSPORT.REPORTS,
        { institutionId, ...filters }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch transport reports');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Report Service] Failed to fetch reports:', error);
      throw error;
    }
  },

  getReportById: async (id: string, institutionId: string): Promise<TransportReportResponse> => {
    try {
      const response = await apiService.get<TransportReportResponse>(
        API_ENDPOINTS.TRANSPORT.REPORT_DETAIL(id),
        { institutionId }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch transport report');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Report Service] Failed to fetch report:', error);
      throw error;
    }
  },

  generateReport: async (institutionId: string, data: Partial<TransportReport>): Promise<TransportReportResponse> => {
    try {
      const response = await apiService.post<TransportReportResponse>(
        API_ENDPOINTS.TRANSPORT.REPORTS,
        { institutionId, ...data }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to generate transport report');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Report Service] Failed to generate report:', error);
      throw error;
    }
  },

  updateReport: async (id: string, institutionId: string, data: Partial<TransportReport>): Promise<TransportReportResponse> => {
    try {
      const response = await apiService.put<TransportReportResponse>(
        API_ENDPOINTS.TRANSPORT.REPORT_DETAIL(id),
        { institutionId, ...data }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update transport report');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Report Service] Failed to update report:', error);
      throw error;
    }
  },

  deleteReport: async (id: string, institutionId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiService.delete<{ success: boolean; message: string }>(
        API_ENDPOINTS.TRANSPORT.REPORT_DETAIL(id),
        { institutionId }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to delete transport report');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Report Service] Failed to delete report:', error);
      throw error;
    }
  },

  bulkDeleteReports: async (ids: string[], institutionId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiService.post<{ success: boolean; message: string }>(
        API_ENDPOINTS.TRANSPORT.BULK_DELETE_REPORTS,
        { ids, institutionId }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to bulk delete transport reports');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Report Service] Failed to bulk delete reports:', error);
      throw error;
    }
  },

  getTransportStatistics: async (institutionId: string): Promise<TransportStatistics> => {
    try {
      const response = await apiService.get<TransportStatistics>(
        API_ENDPOINTS.TRANSPORT.STATISTICS,
        { institutionId }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch transport statistics');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Report Service] Failed to fetch statistics:', error);
      throw error;
    }
  },

  getReportsByType: async (reportType: string, institutionId: string): Promise<TransportReportListResponse> => {
    try {
      const response = await apiService.get<TransportReportListResponse>(
        API_ENDPOINTS.TRANSPORT.REPORTS_BY_TYPE(reportType),
        { institutionId }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch reports by type');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Report Service] Failed to fetch reports by type:', error);
      throw error;
    }
  },

  searchReports: async (institutionId: string, searchTerm: string): Promise<TransportReportListResponse> => {
    try {
      const response = await apiService.get<TransportReportListResponse>(
        API_ENDPOINTS.TRANSPORT.SEARCH_REPORTS,
        { institutionId, searchTerm }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to search transport reports');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Report Service] Failed to search reports:', error);
      throw error;
    }
  }
};

export default transportReportService;
