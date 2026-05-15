// API Service Layer for Frontend
// This file wraps the apiClient from ../api/client to match the expected service interface

import { apiClient } from '../api/client';
import type { ApiResponse as ClientApiResponse } from '../api/client';

// Re-export ApiResponse type
export type ApiResponse<T = any> = ClientApiResponse<T>;

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

// Wrapper to convert AxiosResponse<ApiResponse<T>> to ApiResponse<T>
const apiService = {
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const response = await apiClient.get<T>(endpoint, { params });
    return response.data;
  },

  async post<T>(endpoint: string, data?: any, _p0?: any): Promise<ApiResponse<T>> {
    const response = await apiClient.post<T>(endpoint, data);
    return response.data;
  },

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const response = await apiClient.put<T>(endpoint, data);
    return response.data;
  },

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const response = await apiClient.patch<T>(endpoint, data);
    return response.data;
  },

  async delete<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const response = await apiClient.delete<T>(endpoint, data ? { data } : undefined);
    return response.data;
  }
};

export { apiService };
export default apiService;