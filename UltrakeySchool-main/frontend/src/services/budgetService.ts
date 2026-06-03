import api from './api';

export interface Budget {
  _id?: string;
  title: string;
  plannedAmount: number;
  spentAmount: number;
  academicYear: string;
  category: string;
  status: 'draft' | 'approved' | 'active' | 'closed';
  description?: string;
}

const budgetService = {
  getAll: async (params?: any) => {
    const response = await api.get('/finance/budgets', { params });
    return response.data;
  },

  create: async (data: Budget) => {
    const response = await api.post('/finance/budgets', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Budget>) => {
    const response = await api.put(`/finance/budgets/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/finance/budgets/${id}`);
    return response.data;
  }
};

export default budgetService;
