import apiService, { type ApiResponse } from './api';
import { API_ENDPOINTS } from '../config/api';

export interface Fee {
  id: string;
  studentId: string;
  studentName?: string;
  classId?: string;
  className?: string;
  feeType: 'tuition' | 'transport' | 'hostel' | 'library' | 'exam' | 'other';
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paidAmount?: number;
  paidDate?: string;
  paymentMethod?: string;
  transactionId?: string;
  discount?: number;
  fine?: number;
  notes?: string;
  institutionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paidAmount?: number;
  paidDate?: string;
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
  institutionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  description: string;
  amount: number;
  tax?: number;
  quantity?: number;
}

export interface CreateFeeInput {
  studentId: string;
  classId?: string;
  feeType: 'tuition' | 'transport' | 'hostel' | 'library' | 'exam' | 'other';
  amount: number;
  dueDate: string;
  discount?: number;
  notes?: string;
}

export interface UpdateFeeInput extends Partial<CreateFeeInput> {
  status?: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paidAmount?: number;
  paidDate?: string;
  paymentMethod?: string;
  transactionId?: string;
  fine?: number;
}

export interface CreateInvoiceInput {
  student_id: string;
  items: InvoiceItem[];
  due_date: string;
  discount?: number;
  notes?: string;
}

export interface PayInvoiceInput {
  payment_method: string;
  amount: number;
  transactionId?: string;
}

export interface FeeFilters {
  page?: number;
  limit?: number;
  search?: string;
  studentId?: string;
  classId?: string;
  feeType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedFeeResponse {
  fees: Fee[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaginatedInvoiceResponse {
  invoices: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const feeService = {
  async getAll(params?: FeeFilters): Promise<PaginatedFeeResponse> {
    const queryParams: Record<string, string> = {};
    
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);
    if (params?.search) queryParams.search = params.search;
    if (params?.studentId) queryParams.studentId = params.studentId;
    if (params?.classId) queryParams.classId = params.classId;
    if (params?.feeType) queryParams.feeType = params.feeType;
    if (params?.status) queryParams.status = params.status;
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    if (params?.sortBy) queryParams.sortBy = params.sortBy;
    if (params?.sortOrder) queryParams.sortOrder = params.sortOrder;
    
    const response: ApiResponse<PaginatedFeeResponse> = await apiService.get(
      API_ENDPOINTS.FEES.LIST,
      queryParams
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch fees');
    }
    
    return response.data;
  },

  async getById(id: string): Promise<Fee> {
    const response: ApiResponse<Fee> = await apiService.get(
      API_ENDPOINTS.FEES.DETAIL(id)
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch fee');
    }
    
    return response.data;
  },

  async create(data: CreateFeeInput): Promise<Fee> {
    const response: ApiResponse<Fee> = await apiService.post(
      API_ENDPOINTS.FEES.CREATE,
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create fee');
    }
    
    return response.data;
  },

  async update(id: string, data: UpdateFeeInput): Promise<Fee> {
    const response: ApiResponse<Fee> = await apiService.put(
      API_ENDPOINTS.FEES.UPDATE(id),
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update fee');
    }
    
    return response.data;
  },

  async delete(id: string): Promise<void> {
    const response: ApiResponse<void> = await apiService.delete(
      API_ENDPOINTS.FEES.DELETE(id)
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete fee');
    }
  },

  async getInvoices(params?: FeeFilters): Promise<PaginatedInvoiceResponse> {
    const queryParams: Record<string, string> = {};
    
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);
    if (params?.search) queryParams.search = params.search;
    if (params?.studentId) queryParams.studentId = params.studentId;
    if (params?.status) queryParams.status = params.status;
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    
    const response: ApiResponse<PaginatedInvoiceResponse> = await apiService.get(
      API_ENDPOINTS.FEES.INVOICES,
      queryParams
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch invoices');
    }
    
    return response.data;
  },

  async createInvoice(data: CreateInvoiceInput): Promise<Invoice> {
    const response: ApiResponse<Invoice> = await apiService.post(
      API_ENDPOINTS.FEES.INVOICES,
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create invoice');
    }
    
    return response.data;
  },

  async payInvoice(invoiceId: string, data: PayInvoiceInput): Promise<Invoice> {
    const response: ApiResponse<Invoice> = await apiService.post(
      API_ENDPOINTS.FEES.PAY_INVOICE(invoiceId),
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to pay invoice');
    }
    
    return response.data;
  },
};

export default feeService;
