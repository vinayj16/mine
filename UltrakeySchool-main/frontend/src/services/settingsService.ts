import api from './api';

export interface InvoiceSettings {
  logo?: {
    url: string;
    filename: string;
    size: number;
  };
  prefixes?: {
    invoice: string;
  };
  invoiceDueDays?: number;
  invoiceRoundOff?: boolean;
  invoiceRoundOffType?: 'up' | 'down' | 'nearest';
  showCompanyDetails?: boolean;
  invoiceHeaderTerms?: string;
  invoiceFooterTerms?: string;
}

export interface Settings {
  _id: string;
  settingsId: string;
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  faxNumber?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  logo?: {
    url: string;
    filename: string;
    size: number;
  };
  favicon?: {
    url: string;
    filename: string;
    size: number;
  };
  prefixes?: {
    student?: string;
    teacher?: string;
    staff?: string;
    invoice?: string;
    receipt?: string;
    admission?: string;
  };
  timezone?: string;
  dateFormat?: string;
  timeFormat?: '12' | '24';
  currency?: {
    code: string;
    symbol: string;
    position: 'before' | 'after';
  };
  language?: string;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  maintenanceMode?: boolean;
  institutionId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const settingsService = {
  getSettings: async (institutionId: string) => {
    const response = await api.get(`/settings/institution/${institutionId}`);
    return response.data;
  },

  updateSettings: async (institutionId: string, data: Partial<Settings>) => {
    const response = await api.put(`/settings/institution/${institutionId}`, data);
    return response.data;
  },

  uploadLogo: async (institutionId: string, file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post(`/settings/institution/${institutionId}/logo`, formData);
    return response.data;
  },

  deleteLogo: async (institutionId: string) => {
    const response = await api.delete(`/settings/institution/${institutionId}/logo`);
    return response.data;
  }
};

export default settingsService;
