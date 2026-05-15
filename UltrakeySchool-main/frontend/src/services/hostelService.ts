import apiService, { type ApiResponse } from './api';
import { API_ENDPOINTS } from '../config/api';

// Types
export interface Room {
  id: string;
  roomNumber: string;
  hostel: string;
  floor: number;
  type: 'single' | 'double' | 'triple' | 'quad';
  capacity: number;
  currentOccupancy: number;
  facilities: string[];
  rent: number;
  securityDeposit: number;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Allocation {
  id: string;
  room: string;
  student: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'cancelled';
  allocatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Complaint {
  id: string;
  student: string;
  room: string;
  title: string;
  description: string;
  category: 'maintenance' | 'noise' | 'cleanliness' | 'security' | 'other';
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisitorLog {
  id: string;
  room: string;
  visitorName: string;
  visitorPhone: string;
  visitorIdType: string;
  visitorIdNumber: string;
  checkInTime: string;
  checkOutTime?: string;
  purpose: string;
  checkInBy: string;
  checkOutBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Maintenance {
  id: string;
  room: string;
  description: string;
  category: 'electrical' | 'plumbing' | 'structural' | 'furniture' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed';
  scheduledDate: string;
  completedDate?: string;
  assignedTo?: string;
  cost?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoomInventory {
  id: string;
  room: string;
  item: string;
  quantity: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  lastChecked: string;
  nextCheck?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomInput {
  roomNumber: string;
  hostel: string;
  floor: number;
  type: 'single' | 'double' | 'triple' | 'quad';
  capacity: number;
  facilities: string[];
  rent: number;
  securityDeposit: number;
  description: string;
}

export interface UpdateRoomInput extends Partial<CreateRoomInput> {
  status?: 'available' | 'occupied' | 'maintenance' | 'reserved';
}

export interface CreateAllocationInput {
  room: string;
  student: string;
  startDate: string;
  endDate?: string;
}

export interface CreateComplaintInput {
  room: string;
  title: string;
  description: string;
  category: 'maintenance' | 'noise' | 'cleanliness' | 'security' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface UpdateComplaintStatusInput {
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  assignedTo?: string;
}

export interface CheckInVisitorInput {
  room: string;
  visitorName: string;
  visitorPhone: string;
  visitorIdType: string;
  visitorIdNumber: string;
  purpose: string;
}

export interface CheckOutVisitorInput {
  checkOutBy: string;
}

export interface HostelFilters {
  page?: number;
  limit?: number;
  search?: string;
  hostel?: string;
  floor?: number;
  type?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface HostelDashboard {
  rooms: { total: number; available: number; occupied: number; occupancyRate: string };
  allocations: { active: number };
  complaints: { pending: number };
}

export interface HostelStatistics {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  totalAllocations: number;
  activeAllocations: number;
  totalComplaints: number;
  pendingComplaints: number;
  byHostel: { hostel: string; count: number }[];
}

// API Functions
export const hostelService = {
  // Room Management
  async getRooms(filters: HostelFilters = {}): Promise<PaginatedResponse<Room>> {
    const params: Record<string, string> = {
      page: String(filters.page || 1),
      limit: String(filters.limit || 10),
    };
    
    if (filters.search) params.search = filters.search;
    if (filters.hostel) params.hostel = filters.hostel;
    if (filters.floor) params.floor = String(filters.floor);
    if (filters.type) params.type = filters.type;
    if (filters.status) params.status = filters.status;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;

    const response: ApiResponse<PaginatedResponse<Room>> = await apiService.get(
      API_ENDPOINTS.HOSTEL.ROOMS.LIST,
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch rooms');
    }
    
    return response.data;
  },

  async getRoomById(id: string): Promise<Room> {
    const response: ApiResponse<Room> = await apiService.get(
      API_ENDPOINTS.HOSTEL.ROOMS.DETAIL(id)
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch room');
    }
    
    return response.data;
  },

  async createRoom(data: CreateRoomInput): Promise<Room> {
    const response: ApiResponse<Room> = await apiService.post(
      API_ENDPOINTS.HOSTEL.ROOMS.CREATE,
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create room');
    }
    
    return response.data;
  },

  async updateRoom(id: string, data: UpdateRoomInput): Promise<Room> {
    const response: ApiResponse<Room> = await apiService.put(
      API_ENDPOINTS.HOSTEL.ROOMS.UPDATE(id),
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update room');
    }
    
    return response.data;
  },

  async deleteRoom(id: string): Promise<void> {
    const response: ApiResponse<void> = await apiService.delete(
      API_ENDPOINTS.HOSTEL.ROOMS.DELETE(id)
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete room');
    }
  },

  async getRoomAvailability(params?: Record<string, string>): Promise<Record<string, unknown>[]> {
    const response: ApiResponse<Record<string, unknown>[]> = await apiService.get(
      API_ENDPOINTS.HOSTEL.ROOMS.AVAILABILITY,
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch room availability');
    }
    
    return response.data;
  },

  // Allocation Management
  async getAllocations(params?: Record<string, string>): Promise<Allocation[]> {
    const response: ApiResponse<Allocation[]> = await apiService.get(
      API_ENDPOINTS.HOSTEL.ALLOCATIONS.LIST,
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch allocations');
    }
    
    return response.data;
  },

  async createAllocation(data: CreateAllocationInput): Promise<Allocation> {
    const response: ApiResponse<Allocation> = await apiService.post(
      API_ENDPOINTS.HOSTEL.ALLOCATIONS.CREATE,
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create allocation');
    }
    
    return response.data;
  },

  async checkoutAllocation(id: string): Promise<Allocation> {
    const response: ApiResponse<Allocation> = await apiService.put(
      API_ENDPOINTS.HOSTEL.ALLOCATIONS.CHECKOUT(id),
      {}
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to checkout allocation');
    }
    
    return response.data;
  },

  async getMyAllocation(): Promise<Allocation> {
    const response: ApiResponse<Allocation> = await apiService.get(
      API_ENDPOINTS.HOSTEL.ALLOCATIONS.MY_ALLOCATION
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch my allocation');
    }
    
    return response.data;
  },

  // Complaint Management
  async getComplaints(params?: Record<string, string>): Promise<Complaint[]> {
    const response: ApiResponse<Complaint[]> = await apiService.get(
      API_ENDPOINTS.HOSTEL.COMPLAINTS.LIST,
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch complaints');
    }
    
    return response.data;
  },

  async createComplaint(data: CreateComplaintInput): Promise<Complaint> {
    const response: ApiResponse<Complaint> = await apiService.post(
      API_ENDPOINTS.HOSTEL.COMPLAINTS.CREATE,
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create complaint');
    }
    
    return response.data;
  },

  async updateComplaintStatus(id: string, data: UpdateComplaintStatusInput): Promise<Complaint> {
    const response: ApiResponse<Complaint> = await apiService.put(
      API_ENDPOINTS.HOSTEL.COMPLAINTS.UPDATE_STATUS(id),
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update complaint status');
    }
    
    return response.data;
  },

  // Visitor Log Management
  async getVisitorLogs(params?: Record<string, string>): Promise<VisitorLog[]> {
    const response: ApiResponse<VisitorLog[]> = await apiService.get(
      API_ENDPOINTS.HOSTEL.VISITOR_LOGS.LIST,
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch visitor logs');
    }
    
    return response.data;
  },

  async checkInVisitor(data: CheckInVisitorInput): Promise<VisitorLog> {
    const response: ApiResponse<VisitorLog> = await apiService.post(
      API_ENDPOINTS.HOSTEL.VISITOR_LOGS.CHECK_IN,
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to check in visitor');
    }
    
    return response.data;
  },

  async checkOutVisitor(id: string, data: CheckOutVisitorInput): Promise<VisitorLog> {
    const response: ApiResponse<VisitorLog> = await apiService.put(
      API_ENDPOINTS.HOSTEL.VISITOR_LOGS.CHECK_OUT(id),
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to check out visitor');
    }
    
    return response.data;
  },

  // Dashboard
  async getDashboard(): Promise<HostelDashboard> {
    const response: ApiResponse<HostelDashboard> = await apiService.get(
      API_ENDPOINTS.HOSTEL.DASHBOARD
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch dashboard');
    }
    
    return response.data;
  },

  // Maintenance
  async getMaintenance(params?: Record<string, string>): Promise<Maintenance[]> {
    const response: ApiResponse<Maintenance[]> = await apiService.get(
      API_ENDPOINTS.HOSTEL.MAINTENANCE,
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch maintenance');
    }
    
    return response.data;
  },

  // Inventory
  async getInventory(params?: Record<string, string>): Promise<RoomInventory[]> {
    const response: ApiResponse<RoomInventory[]> = await apiService.get(
      API_ENDPOINTS.HOSTEL.INVENTORY,
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch inventory');
    }
    
    return response.data;
  },

  // Bulk operations
  async bulkDeleteRooms(ids: string[]): Promise<void> {
    const response: ApiResponse<void> = await apiService.post(
      `${API_ENDPOINTS.HOSTEL.ROOMS.LIST}/bulk-delete`,
      { ids }
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to bulk delete rooms');
    }
  },

  // Export
  async exportRoomsCSV(filters: HostelFilters = {}): Promise<Blob> {
    const params: Record<string, string> = { format: 'csv' };
    
    if (filters.search) params.search = filters.search;
    if (filters.hostel) params.hostel = filters.hostel;
    if (filters.type) params.type = filters.type;
    if (filters.status) params.status = filters.status;
    
    const response: ApiResponse<Blob> = await apiService.get(
      `${API_ENDPOINTS.HOSTEL.ROOMS.LIST}/export`,
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to export rooms to CSV');
    }
    
    return response.data;
  },

  async exportRoomsPDF(filters: HostelFilters = {}): Promise<Blob> {
    const params: Record<string, string> = { format: 'pdf' };
    
    if (filters.search) params.search = filters.search;
    if (filters.hostel) params.hostel = filters.hostel;
    if (filters.type) params.type = filters.type;
    if (filters.status) params.status = filters.status;
    
    const response: ApiResponse<Blob> = await apiService.get(
      `${API_ENDPOINTS.HOSTEL.ROOMS.LIST}/export`,
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to export rooms to PDF');
    }
    
    return response.data;
  },

  // Statistics
  async getStatistics(): Promise<HostelStatistics> {
    const response: ApiResponse<HostelStatistics> = await apiService.get(
      `${API_ENDPOINTS.HOSTEL.ROOMS.LIST}/statistics`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch statistics');
    }
    
    return response.data;
  },
};

export default hostelService;
