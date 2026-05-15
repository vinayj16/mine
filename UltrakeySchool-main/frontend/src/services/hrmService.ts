import type { AxiosRequestConfig } from 'axios';
import { apiClient } from '../api/client';
import { API_ENDPOINTS } from '../config/api';
import type { Key, ReactNode } from 'react';

export interface HrmDepartment {
  staffCount: ReactNode;
  headOfDepartment: ReactNode;
  id: Key | null | undefined;
  departmentId?: string;
  name: string;
  code?: string;
  description?: string;
  status?: 'active' | 'inactive';
}

export interface HrmDesignation {
  designationId: string;
  name: string;
  code?: string;
  level?: number;
  department?: string;
  description?: string;
  status: 'active' | 'inactive';
}

export interface HrmStaff {
  emergencyContact: any;
  address: any;
  salary: any;
  joinDate: ReactNode;
  id: string | null;
  _id: string;
  employeeId?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  avatar?: string;
  department?: string;
  designation?: string;
  joiningDate?: string;
  status?: string;
}

export interface HrmLeaveRecord {
  id: Key | null | undefined;
  days: ReactNode;
  _id: string;
  staffId?: string;
  staffName?: string;
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  totalDays?: number;
  reason?: string;
  status?: string;
  appliedOn?: string;
  approvedOn?: string;
}

export interface HrmStats {
  totalStaff: number;
  activeStaff: number;
  onLeaveStaff: number;
  totalDepartments: number;
  totalDesignations: number;
  pendingLeaves: number;
  approvedLeaves: number;
}

class HrmService {
  async listStaff(params?: { department?: string; status?: string; search?: string }): Promise<HrmStaff[]> {
    const config: AxiosRequestConfig = {
      params: {
        ...(params?.department && { department: params.department }),
        ...(params?.status && { status: params.status }),
        ...(params?.search && { search: params.search })
      }
    };

    const response = await apiClient.get<HrmStaff[]>(API_ENDPOINTS.HRM.STAFF, config);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Unable to load staff');
    }

    return response.data.data || [];
  }

  async getStaffById(staffId: string): Promise<HrmStaff> {
    const response = await apiClient.get<HrmStaff>(`${API_ENDPOINTS.HRM.STAFF}/${staffId}`);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Unable to load staff member');
    }

    if (!response.data.data) {
      throw new Error('Staff payload missing from API');
    }

    return response.data.data;
  }

  async listDepartments(): Promise<HrmDepartment[]> {
    const response = await apiClient.get<HrmDepartment[]>(API_ENDPOINTS.HRM.DEPARTMENTS);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Unable to load departments');
    }

    return response.data.data || [];
  }

  async listDesignations(params?: { status?: string; department?: string }): Promise<HrmDesignation[]> {
    const config: AxiosRequestConfig = {
      params: {
        ...(params?.status && { status: params.status }),
        ...(params?.department && { department: params.department })
      }
    };

    const response = await apiClient.get<HrmDesignation[]>(API_ENDPOINTS.HRM.DESIGNATIONS, config);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Unable to load designations');
    }

    if (!response.data.data) {
      throw new Error('Designations payload missing from API');
    }

    return response.data.data;
  }

  async deleteDesignation(designationId: string): Promise<void> {
    const response = await apiClient.delete<{ success: boolean; message?: string }>(
      `${API_ENDPOINTS.HRM.DESIGNATIONS}/${designationId}`
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete designation');
    }
  }

  async createDesignation(data: Omit<HrmDesignation, 'designationId'>): Promise<HrmDesignation> {
    const response = await apiClient.post<HrmDesignation>(API_ENDPOINTS.HRM.DESIGNATIONS, data);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create designation');
    }

    if (!response.data.data) {
      throw new Error('Designation data missing from API response');
    }

    return response.data.data;
  }

  async updateDesignation(designationId: string, data: Partial<HrmDesignation>): Promise<HrmDesignation> {
    const response = await apiClient.put<HrmDesignation>(
      `${API_ENDPOINTS.HRM.DESIGNATIONS}/${designationId}`,
      data
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update designation');
    }

    if (!response.data.data) {
      throw new Error('Designation data missing from API response');
    }

    return response.data.data;
  }

  async listLeaveRecords(params?: { status?: string; staffId?: string }): Promise<HrmLeaveRecord[]> {
    const config: AxiosRequestConfig = {
      params: {
        ...(params?.status && { status: params.status }),
        ...(params?.staffId && { staffId: params.staffId })
      }
    };

    const response = await apiClient.get<HrmLeaveRecord[]>(API_ENDPOINTS.HRM.LEAVES, config);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Unable to load leave records');
    }

    return response.data.data || [];
  }

  async getStats(): Promise<HrmStats> {
    // No single backend endpoint is guaranteed here; compute from live lists
    const [staff, departments, designations, leaves] = await Promise.all([
      this.listStaff(),
      this.listDepartments(),
      this.listDesignations(),
      this.listLeaveRecords()
    ]);

    const activeStaff = staff.filter((s) => (s.status || '').toLowerCase() === 'active').length;
    const onLeaveStaff = staff.filter((s) => (s.status || '').toLowerCase().includes('leave')).length;
    const pendingLeaves = leaves.filter((l) => (l.status || '').toLowerCase() === 'pending').length;
    const approvedLeaves = leaves.filter((l) => (l.status || '').toLowerCase() === 'approved').length;

    return {
      totalStaff: staff.length,
      activeStaff,
      onLeaveStaff,
      totalDepartments: departments.length,
      totalDesignations: designations.length,
      pendingLeaves,
      approvedLeaves
    };
  }
}

export const hrmService = new HrmService();
export default hrmService;
