import api from './api';

export interface Payroll {
  _id?: string;
  payrollId?: string;
  employee: any; // User object or ID
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'paid' | 'generated' | 'pending';
  paymentDate?: string;
  paymentMethod: 'bank-transfer' | 'cash' | 'cheque';
  notes?: string;
}

const payrollService = {
  getAll: async (params?: any) => {
    const response = await api.get('/hrm/payroll', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/hrm/payroll/${id}`);
    return response.data;
  },

  create: async (data: Payroll) => {
    const response = await api.post('/hrm/payroll', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Payroll>) => {
    const response = await api.put(`/hrm/payroll/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/hrm/payroll/${id}`);
    return response.data;
  }
};

export default payrollService;
