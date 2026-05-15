import apiClient from './client';
import type { ApiResponse } from './client';

export interface FinanceDashboardData {
  topStats: Array<{
    label: string;
    value: string;
    delta: string;
    deltaTone: string;
    icon?: string;
    active?: string;
    inactive?: string;
    avatarTone?: string;
  }>;
  financeKPIs: Array<{
    label: string;
    value: string;
    delta: string;
    deltaTone: string;
    icon?: string;
    active?: string;
    inactive?: string;
    avatarTone?: string;
  }>;
  revenueData: Array<{
    m: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  expensePie: Array<{
    name: string;
    value: number;
  }>;
  budgetVsActual: Array<{
    dept: string;
    budget: number;
    actual: number;
    variance: number;
  }>;
  recentInvoices: Array<{
    id: string;
    student: string;
    amount: string;
    status: string;
    cls: string;
  }>;
  feeByTerm: Array<{
    q: string;
    collected: number;
    outstanding: number;
  }>;
}

export const financeService = {
  getDashboardData: async (): Promise<ApiResponse<FinanceDashboardData>> => {
    try {
      const response = await apiClient.get<FinanceDashboardData>('/finance/dashboard');
      return response.data;
    } catch (error: any) {
      console.error('Finance service error:', error);
      throw error;
    }
  },

  getRevenueAnalytics: async (period?: string): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.get(`/finance/analytics/revenue${period ? `?period=${period}` : ''}`);
      return response.data;
    } catch (error: any) {
      console.error('Revenue analytics error:', error);
      throw error;
    }
  },

  getExpenseAnalytics: async (period?: string): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.get(`/finance/analytics/expenses${period ? `?period=${period}` : ''}`);
      return response.data;
    } catch (error: any) {
      console.error('Expense analytics error:', error);
      throw error;
    }
  },

  getBudgetAnalytics: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.get('/finance/analytics/budget');
      return response.data;
    } catch (error: any) {
      console.error('Budget analytics error:', error);
      throw error;
    }
  },

  getInvoices: async (page = 1, limit = 10, filters?: any): Promise<ApiResponse<any>> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      const response = await apiClient.get(`/finance/invoices?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Invoices error:', error);
      throw error;
    }
  },

  getTransactions: async (page = 1, limit = 10, filters?: any): Promise<ApiResponse<any>> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      const response = await apiClient.get(`/finance/transactions?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Transactions error:', error);
      throw error;
    }
  },

  getFeeStructure: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.get('/finance/fees/structure');
      return response.data;
    } catch (error: any) {
      console.error('Fee structure error:', error);
      throw error;
    }
  },

  createInvoice: async (invoiceData: any): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.post('/finance/invoices', invoiceData);
      return response.data;
    } catch (error: any) {
      console.error('Create invoice error:', error);
      throw error;
    }
  },

  updateInvoice: async (id: string, invoiceData: any): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.put(`/finance/invoices/${id}`, invoiceData);
      return response.data;
    } catch (error: any) {
      console.error('Update invoice error:', error);
      throw error;
    }
  },

  deleteInvoice: async (id: string): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.delete(`/finance/invoices/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete invoice error:', error);
      throw error;
    }
  },

  collectFees: async (feeData: any): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.post('/finance/fees/collect', feeData);
      return response.data;
    } catch (error: any) {
      console.error('Collect fees error:', error);
      throw error;
    }
  }
};

export default financeService