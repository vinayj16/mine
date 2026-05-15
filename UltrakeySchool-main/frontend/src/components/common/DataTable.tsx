import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/api';

// Define types locally to avoid import issues
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface FilterConfig {
  search?: string;
  status?: string;
  [key: string]: any;
}

interface UseDataTableOptions {
  endpoint?: string;
  initialPage?: number;
  initialLimit?: number;
  initialSort?: SortConfig;
  initialFilters?: FilterConfig;
  autoFetch?: boolean;
}

export const useDataTable = <T extends Record<string, any>>(
  options: UseDataTableOptions = {}
) => {
  const {
    endpoint,
    initialPage = 1,
    initialLimit = 10,
    initialSort,
    initialFilters = {},
    autoFetch = true
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0
  });
  const [sort, setSort] = useState<SortConfig | undefined>(initialSort);
  const [filters, setFilters] = useState<FilterConfig>(initialFilters);

  const fetchData = useCallback(async () => {
    if (!endpoint) return;

    try {
      setLoading(true);
      setError(null);

      const params: Record<string, any> = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };

      if (sort) {
        params.sort = sort.key;
        params.order = sort.direction;
      }

      const response = await apiService.get<{
        items: T[];
        pagination: PaginationMeta;
      }>(endpoint, params);

      if (response.success && response.data) {
        setData(response.data.items || []);
        setPagination(response.data.pagination || pagination);
      } else {
        setData([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
      console.error('DataTable fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, pagination.page, pagination.limit, sort, filters]);

  useEffect(() => {
    if (autoFetch && endpoint) {
      fetchData();
    }
  }, [fetchData, autoFetch, endpoint]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  const setSorting = useCallback((newSort: SortConfig | undefined) => {
    setSort(newSort);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const setFiltering = useCallback((newFilters: FilterConfig) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  return {
    data,
    loading,
    error,
    pagination,
    sort,
    filters,
    refresh,
    setPage,
    setLimit,
    setSorting,
    setFiltering
  };
};

export default useDataTable;
