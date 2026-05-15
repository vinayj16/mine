import apiService from './api';
import { API_ENDPOINTS } from '../config/api';

export interface PickupPoint {
  _id: string;
  institutionId: string;
  name: string;
  address: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  routeId?: {
    _id: string;
    name: string;
  };
  status: 'Active' | 'Inactive';
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PickupPointFilters {
  status?: string;
  routeId?: string;
}

export interface PickupPointListResponse {
  success: boolean;
  data: PickupPoint[];
  count: number;
}

export interface PickupPointResponse {
  success: boolean;
  data: PickupPoint;
  message?: string;
}

export const pickupPointService = {
  getAllPickupPoints: async (institutionId: string, filters?: PickupPointFilters): Promise<PickupPointListResponse> => {
    try {
      const response = await apiService.get<PickupPointListResponse>(
        API_ENDPOINTS.TRANSPORT.PICKUP_POINTS,
        { institutionId, ...filters }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch pickup points');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Pickup Point Service] Failed to fetch pickup points:', error);
      throw error;
    }
  },

  getPickupPointById: async (id: string, institutionId: string): Promise<PickupPointResponse> => {
    try {
      const response = await apiService.get<PickupPointResponse>(
        `${API_ENDPOINTS.TRANSPORT.PICKUP_POINTS}/${id}`,
        { institutionId }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch pickup point');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Pickup Point Service] Failed to fetch pickup point:', error);
      throw error;
    }
  },

  createPickupPoint: async (institutionId: string, data: Partial<PickupPoint>): Promise<PickupPointResponse> => {
    try {
      const response = await apiService.post<PickupPointResponse>(
        API_ENDPOINTS.TRANSPORT.PICKUP_POINTS,
        { institutionId, ...data }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create pickup point');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Pickup Point Service] Failed to create pickup point:', error);
      throw error;
    }
  },

  updatePickupPoint: async (id: string, institutionId: string, data: Partial<PickupPoint>): Promise<PickupPointResponse> => {
    try {
      const response = await apiService.put<PickupPointResponse>(
        `${API_ENDPOINTS.TRANSPORT.PICKUP_POINTS}/${id}`,
        { institutionId, ...data }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update pickup point');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Pickup Point Service] Failed to update pickup point:', error);
      throw error;
    }
  },

  deletePickupPoint: async (id: string, institutionId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiService.delete<{ success: boolean; message: string }>(
        `${API_ENDPOINTS.TRANSPORT.PICKUP_POINTS}/${id}`,
        { institutionId }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to delete pickup point');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Pickup Point Service] Failed to delete pickup point:', error);
      throw error;
    }
  },

  bulkDeletePickupPoints: async (ids: string[], institutionId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiService.post<{ success: boolean; message: string }>(
        `${API_ENDPOINTS.TRANSPORT.PICKUP_POINTS}/bulk-delete`,
        { ids, institutionId }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to bulk delete pickup points');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Pickup Point Service] Failed to bulk delete pickup points:', error);
      throw error;
    }
  },

  getPickupPointsByRoute: async (routeId: string, institutionId: string): Promise<PickupPointListResponse> => {
    try {
      const response = await apiService.get<PickupPointListResponse>(
        `${API_ENDPOINTS.TRANSPORT.PICKUP_POINTS}/route/${routeId}`,
        { institutionId }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch pickup points by route');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Pickup Point Service] Failed to fetch pickup points by route:', error);
      throw error;
    }
  }
};

export default pickupPointService;
