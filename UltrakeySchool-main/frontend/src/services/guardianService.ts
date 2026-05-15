import type { AxiosRequestConfig } from 'axios';
import { apiClient } from '../api/client';

export interface GuardianChildStudent {
  _id?: string;
  studentId?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  classId?: string | { _id?: string; name?: string };
  section?: string;
}

export interface GuardianChild {
  studentId?: GuardianChildStudent;
  relationship?: {
    type?: string;
    isPrimary?: boolean;
    isEmergency?: boolean;
  };
  isActive?: boolean;
}

export interface GuardianApi {
  _id: string;
  guardianId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  status?: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt?: string;
  children?: GuardianChild[];
}

export interface GuardianListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface GuardianListResponse {
  guardians: GuardianApi[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const BASE_PATH = '/guardians';

class GuardianService {
  async listForSchool(
    schoolId: string,
    params: GuardianListParams = {}
  ): Promise<GuardianListResponse> {
    if (!schoolId) {
      throw new Error('School ID is required to fetch guardians');
    }

    const query: AxiosRequestConfig = {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        ...(params.status && { status: params.status }),
        ...(params.search && { search: params.search })
      }
    };

    const response = await apiClient.get<GuardianListResponse>(
      `${BASE_PATH}/schools/${schoolId}`,
      query
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to load guardians');
    }

    if (!response.data.data) {
      throw new Error('Received empty guardian payload');
    }

    return response.data.data;
  }
}

export const guardianService = new GuardianService();
export default guardianService;
