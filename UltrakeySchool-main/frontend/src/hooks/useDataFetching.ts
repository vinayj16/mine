import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

// Generic types for API responses
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Generic data fetching hook
export function useFetchData<T>(
  endpoint: string,
  params?: Record<string, any>,
  options?: {
    enabled?: boolean;
    refetchOnMount?: boolean;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!options?.enabled && options?.enabled !== undefined) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.get<T>(endpoint, params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch data');
      }
      setData(response.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, params, options?.enabled]);

  useEffect(() => {
    if (options?.refetchOnMount !== false) {
      fetchData();
    }
  }, [fetchData, options?.refetchOnMount]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

// Fetch by ID hook
export function useFetchById<T>(
  endpoint: string,
  id?: string | number,
  options?: {
    enabled?: boolean;
  }
) {
  const enabled = options?.enabled ?? !!id;
  return useFetchData<T>(
    id ? `${endpoint}/${id}` : endpoint,
    undefined,
    { enabled, refetchOnMount: enabled }
  );
}

// Search hook
export function useSearch<T>(
  endpoint: string,
  searchParams: SearchParams,
  options?: {
    enabled?: boolean;
  }
) {
  const enabled = options?.enabled ?? !!searchParams.query?.trim();

  const params = {
    q: searchParams.query,
    ...searchParams.filters,
    sort: searchParams.sortBy,
    order: searchParams.sortOrder,
  };

  return useFetchData<PaginatedResponse<T>>(
    `${endpoint}/search`,
    params,
    { enabled, refetchOnMount: enabled }
  );
}

// CRUD mutation hook
export function useCRUDMutation<TData = any, TVariables = any>(
  endpoint: string,
  options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
  }
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = useCallback(async (data: Omit<TVariables, 'id'>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.post<TData>(endpoint, data);
      if (!response.success) {
        throw new Error(response.message || 'Create failed');
      }
      if (response.data) {
        options?.onSuccess?.(response.data);
      }
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options?.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, options]);

  const update = useCallback(async ({ id, data }: { id: string | number; data: Partial<TVariables> }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.put<TData>(`${endpoint}/${id}`, data);
      if (!response.success) {
        throw new Error(response.message || 'Update failed');
      }
      if (response.data) {
        options?.onSuccess?.(response.data);
      }
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options?.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, options]);

  const deleteRecord = useCallback(async (id: string | number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.delete(`${endpoint}/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Delete failed');
      }
      options?.onSuccess?.(response.data as TData);
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options?.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, options]);

  return {
    create,
    update,
    delete: deleteRecord,
    isLoading,
    error,
  };
}

// Specialized hooks for common entities

// Students hooks
export function useStudents(params?: { class?: string; status?: string }) {
  return useFetchData('/students', params);
}

export function useStudent(id?: string) {
  return useFetchById('/students', id);
}

export function useStudentMutations() {
  return useCRUDMutation('/students');
}

// Teachers hooks
export function useTeachers(params?: { subject?: string; status?: string }) {
  return useFetchData('/teachers', params);
}

export function useTeacher(id?: string) {
  return useFetchById('/teachers', id);
}

export function useTeacherMutations() {
  return useCRUDMutation('/teachers');
}

// Classes hooks
export function useClasses(params?: { grade?: string }) {
  return useFetchData('/classes', params);
}

export function useClass(id?: string) {
  return useFetchById('/classes', id);
}

export function useClassMutations() {
  return useCRUDMutation('/classes');
}

// Attendance hooks
export function useAttendance(params?: { date?: string; classId?: string }) {
  return useFetchData('/attendance', params);
}

export function useAttendanceMutations() {
  return useCRUDMutation('/attendance');
}

// Fee hooks
export function useFees(params?: { status?: string; studentId?: string }) {
  return useFetchData('/fees', params);
}

export function useFeeMutations() {
  return useCRUDMutation('/fees');
}

// Analytics hooks
export function useAnalytics(endpoint: string, params?: Record<string, any>) {
  return useFetchData(`/analytics/${endpoint}`, params);
}

export function useDashboardData(type: 'academic' | 'finance' | 'hr') {
  return useFetchData(`/dashboard/${type}`);
}
