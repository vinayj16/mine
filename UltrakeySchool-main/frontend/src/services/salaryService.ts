import api from './api';

export interface Salary {
  _id?: string;
  employee: any; // User object or ID
  basicSalary: number;
  allowances: Array<{ title: string; amount: number }>;
  deductions: Array<{ title: string; amount: number }>;
  grossSalary?: number;
  netSalary?: number;
  paymentDate?: string;
  month: string;
  year: number;
  paymentMethod: string;
}

const salaryService = {
  getAll: async (params?: any) => {
    const response = await api.get('/finance/salaries', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/finance/salaries/${id}`);
    return response.data;
  },

  create: async (data: Salary) => {
    const response = await api.post('/finance/salaries', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Salary>) => {
    const response = await api.put(`/finance/salaries/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/finance/salaries/${id}`);
    return response.data;
  }
};

export default salaryService;
