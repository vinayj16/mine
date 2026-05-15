import apiService from './api';
import { API_ENDPOINTS } from '../config/api';

export interface TransportAssignment {
  _id: string;
  institutionId: string;
  studentId: string;
  routeId: string;
  vehicleId: string;
  pickupPointId: string;
  assignmentDate: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt?: string;
  updatedAt?: string;
}

export interface TransportAssignmentFilters {
  page?: number;
  limit?: number;
  search?: string;
  routeId?: string;
  vehicleId?: string;
  status?: string;
}

export interface TransportAssignmentListResponse {
  success: boolean;
  data: TransportAssignment[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TransportAssignmentResponse {
  success: boolean;
  data: TransportAssignment;
}

export const transportAssignmentService = {
  getAllAssignments: async (institutionId: string, filters?: TransportAssignmentFilters): Promise<TransportAssignmentListResponse> => {
    try {
      const response = await apiService.get<TransportAssignmentListResponse>(
        API_ENDPOINTS.TRANSPORT.ASSIGNMENTS,
        { institutionId, ...filters }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch transport assignments');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Assignment Service] Failed to fetch assignments:', error);
      throw error;
    }
  },

  getAssignmentById: async (id: string, institutionId: string): Promise<TransportAssignmentResponse> => {
    try {
      const response = await apiService.get<TransportAssignmentResponse>(
        API_ENDPOINTS.TRANSPORT.ASSIGNMENT_DETAIL(id),
        { institutionId }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch transport assignment');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Assignment Service] Failed to fetch assignment:', error);
      throw error;
    }
  },

  createAssignment: async (institutionId: string, data: Partial<TransportAssignment>): Promise<TransportAssignmentResponse> => {
    try {
      const response = await apiService.post<TransportAssignmentResponse>(
        API_ENDPOINTS.TRANSPORT.ASSIGNMENTS,
        { institutionId, ...data }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create transport assignment');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Assignment Service] Failed to create assignment:', error);
      throw error;
    }
  },

  updateAssignment: async (id: string, institutionId: string, data: Partial<TransportAssignment>): Promise<TransportAssignmentResponse> => {
    try {
      const response = await apiService.put<TransportAssignmentResponse>(
        API_ENDPOINTS.TRANSPORT.ASSIGNMENT_DETAIL(id),
        { institutionId, ...data }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update transport assignment');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Assignment Service] Failed to update assignment:', error);
      throw error;
    }
  },

  deleteAssignment: async (id: string, institutionId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiService.delete<{ success: boolean; message: string }>(
        API_ENDPOINTS.TRANSPORT.ASSIGNMENT_DETAIL(id),
        { institutionId }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to delete transport assignment');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Assignment Service] Failed to delete assignment:', error);
      throw error;
    }
  },

  bulkDeleteAssignments: async (ids: string[], institutionId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiService.post<{ success: boolean; message: string }>(
        API_ENDPOINTS.TRANSPORT.BULK_DELETE,
        { ids, institutionId }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to bulk delete transport assignments');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Assignment Service] Failed to bulk delete assignments:', error);
      throw error;
    }
  },

  getAssignmentsByRoute: async (routeId: string, institutionId: string): Promise<TransportAssignmentListResponse> => {
    try {
      const response = await apiService.get<TransportAssignmentListResponse>(
        API_ENDPOINTS.TRANSPORT.ASSIGNMENTS_BY_ROUTE(routeId),
        { institutionId }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch assignments by route');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Assignment Service] Failed to fetch assignments by route:', error);
      throw error;
    }
  },

  getAssignmentsByVehicle: async (vehicleId: string, institutionId: string): Promise<TransportAssignmentListResponse> => {
    try {
      const response = await apiService.get<TransportAssignmentListResponse>(
        API_ENDPOINTS.TRANSPORT.ASSIGNMENTS_BY_VEHICLE(vehicleId),
        { institutionId }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch assignments by vehicle');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Assignment Service] Failed to fetch assignments by vehicle:', error);
      throw error;
    }
  }
};

export default transportAssignmentService;
