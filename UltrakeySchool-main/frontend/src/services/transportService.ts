import apiService from './api';
import type { ApiResponse } from './api';
import { API_ENDPOINTS } from '../config/api';

function extractArrayData(response: ApiResponse<any>): any[] {
  if (!response) return [];
  if (response.success && response.data) {
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data.data)) return response.data.data;
    if (response.data.pickupPoints) return response.data.pickupPoints;
    if (response.data.routes) return response.data.routes;
    if (response.data.vehicles) return response.data.vehicles;
    if (response.data.drivers) return response.data.drivers;
    if (response.data.assignments) return response.data.assignments;
  }
  if (Array.isArray(response)) return response;
  return [];
}

export interface PickupPoint {
  _id: string;
  institutionId?: string;
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
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TransportRoute {
  _id: string;
  routeName: string;
  vehicle: string;
  startTime: string;
  endTime: string;
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface Vehicle {
  _id: string;
  vehicleNumber: string;
  vehicleType: string;
  driverName: string;
  phone: string;
  capacity: number;
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface Driver {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  experience: number;
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface Assignment {
  _id: string;
  studentId: string;
  routeId: string;
  vehicleId: string;
  pickupPointId: string;
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

export const transportService = {
  // Pickup Points
  async getPickupPoints(params?: Record<string, unknown>): Promise<PickupPoint[]> {
    try {
      const timestamp = { _t: Date.now() };
      const response = await apiService.get<PickupPoint[]>(
        API_ENDPOINTS.TRANSPORT.PICKUP_POINTS,
        { ...params, ...timestamp }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch pickup points');
      }
      
      return extractArrayData(response);
    } catch (error) {
      console.error('[Transport Service] Failed to fetch pickup points:', error);
      throw error;
    }
  },

  async createPickupPoint(data: Partial<PickupPoint>): Promise<PickupPoint> {
    try {
      const response = await apiService.post<PickupPoint>(
        API_ENDPOINTS.TRANSPORT.PICKUP_POINTS,
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create pickup point');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Service] Failed to create pickup point:', error);
      throw error;
    }
  },

  async updatePickupPoint(id: string, data: Partial<PickupPoint>): Promise<PickupPoint> {
    try {
      const response = await apiService.put<PickupPoint>(
        `${API_ENDPOINTS.TRANSPORT.PICKUP_POINTS}/${id}`,
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update pickup point');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Service] Failed to update pickup point:', error);
      throw error;
    }
  },

  async deletePickupPoint(id: string, payload?: Record<string, unknown>): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.delete<{ success: boolean; message: string }>(
        `${API_ENDPOINTS.TRANSPORT.PICKUP_POINTS}/${id}`,
        payload
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to delete pickup point');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Service] Failed to delete pickup point:', error);
      throw error;
    }
  },

  async bulkDeletePickupPoints(ids: string[], params?: Record<string, unknown>): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.post<{ success: boolean; message: string }>(
        `${API_ENDPOINTS.TRANSPORT.PICKUP_POINTS}/bulk-delete`,
        { ids, ...params }
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to bulk delete pickup points');
      }

      return response.data;
    } catch (error) {
      console.error('[Transport Service] Failed to bulk delete pickup points:', error);
      throw error;
    }
  },

  // Routes
  async getRoutes(params?: Record<string, unknown>): Promise<TransportRoute[]> {
    try {
      const response = await apiService.get<TransportRoute[]>(
        API_ENDPOINTS.TRANSPORT.ROUTES,
        params
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch routes');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Service] Failed to fetch routes:', error);
      throw error;
    }
  },

  async createRoute(data: Partial<TransportRoute>): Promise<TransportRoute> {
    try {
      const response = await apiService.post<TransportRoute>(
        API_ENDPOINTS.TRANSPORT.ROUTES,
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create route');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Service] Failed to create route:', error);
      throw error;
    }
  },

  async updateRoute(id: string, data: Partial<TransportRoute>): Promise<TransportRoute> {
    try {
      const response = await apiService.put<TransportRoute>(
        `${API_ENDPOINTS.TRANSPORT.ROUTES}/${id}`,
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update route');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Service] Failed to update route:', error);
      throw error;
    }
  },

  async deleteRoute(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.delete<{ success: boolean; message: string }>(
        `${API_ENDPOINTS.TRANSPORT.ROUTES}/${id}`
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to delete route');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Service] Failed to delete route:', error);
      throw error;
    }
  },

  // Vehicles
  async getVehicles(params?: Record<string, unknown>): Promise<Vehicle[]> {
    try {
      const response = await apiService.get<Vehicle[]>(
        API_ENDPOINTS.TRANSPORT.VEHICLES,
        params
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch vehicles');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Service] Failed to fetch vehicles:', error);
      throw error;
    }
  },

  async createVehicle(data: Partial<Vehicle>): Promise<Vehicle> {
    try {
      const response = await apiService.post<Vehicle>(
        API_ENDPOINTS.TRANSPORT.VEHICLES,
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create vehicle');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Service] Failed to create vehicle:', error);
      throw error;
    }
  },

  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    try {
      const response = await apiService.put<Vehicle>(
        `${API_ENDPOINTS.TRANSPORT.VEHICLES}/${id}`,
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update vehicle');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Service] Failed to update vehicle:', error);
      throw error;
    }
  },

  async deleteVehicle(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.delete<{ success: boolean; message: string }>(
        `${API_ENDPOINTS.TRANSPORT.VEHICLES}/${id}`
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to delete vehicle');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Service] Failed to delete vehicle:', error);
      throw error;
    }
  },

  // Drivers
  async getDrivers(params?: Record<string, unknown>): Promise<Driver[]> {
    try {
      const response = await apiService.get<Driver[]>(
        API_ENDPOINTS.DRIVERS.LIST,
        params
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch drivers');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Service] Failed to fetch drivers:', error);
      throw error;
    }
  },

  async createDriver(data: Partial<Driver>): Promise<Driver> {
    try {
      const response = await apiService.post<Driver>(
        API_ENDPOINTS.DRIVERS.CREATE,
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create driver');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Service] Failed to create driver:', error);
      throw error;
    }
  },

  async updateDriver(id: string, data: Partial<Driver>): Promise<Driver> {
    try {
      const response = await apiService.put<Driver>(
        API_ENDPOINTS.DRIVERS.UPDATE(id),
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update driver');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Service] Failed to update driver:', error);
      throw error;
    }
  },

  async deleteDriver(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.delete<{ success: boolean; message: string }>(
        API_ENDPOINTS.DRIVERS.DELETE(id)
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to delete driver');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Service] Failed to delete driver:', error);
      throw error;
    }
  },

  // Vehicle Assignment
  async getAssignments(params?: Record<string, unknown>): Promise<Assignment[]> {
    try {
      const response = await apiService.get<Assignment[]>(
        API_ENDPOINTS.TRANSPORT.ASSIGNMENTS,
        params
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch assignments');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Service] Failed to fetch assignments:', error);
      throw error;
    }
  },

  async createAssignment(data: Partial<Assignment>): Promise<Assignment> {
    try {
      const response = await apiService.post<Assignment>(
        API_ENDPOINTS.TRANSPORT.ASSIGNMENTS,
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create assignment');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Service] Failed to create assignment:', error);
      throw error;
    }
  },

  async updateAssignment(id: string, data: Partial<Assignment>): Promise<Assignment> {
    try {
      const response = await apiService.put<Assignment>(
        API_ENDPOINTS.TRANSPORT.ASSIGNMENT_DETAIL(id),
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update assignment');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Service] Failed to update assignment:', error);
      throw error;
    }
  },

  async deleteAssignment(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.delete<{ success: boolean; message: string }>(
        API_ENDPOINTS.TRANSPORT.ASSIGNMENT_DETAIL(id)
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to delete assignment');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Transport Service] Failed to delete assignment:', error);
      throw error;
    }
  },
};

export default transportService;
