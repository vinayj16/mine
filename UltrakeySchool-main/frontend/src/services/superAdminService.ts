import apiService from './api';

export interface Institution {
  _id: string;
  name: string;
  type: string;
  plan?: string;
  status: 'Active' | 'Suspended' | 'Expired' | 'active' | 'inactive' | 'suspended' | 'pending' | 'closed';
  subscriptionExpiry?: string;
  autoRenew?: boolean;
  lastPaymentDate?: string;
  nextPaymentDate?: string;
  overdueAmount?: number;
  contactEmail?: string;
  contactPhone?: string;
  code?: string;
  instituteCode?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  maxUsers?: number;
  currentUsers?: number;
  maxSchools?: number;
  currentSchools?: number;
  createdAt?: string;
  updatedAt?: string;
  principalName?: string;
  principalEmail?: string;
  principalPhone?: string;
  // Additional properties for dashboard compatibility
  adminName?: string;
  students?: number;
  _monthlyRevenue?: number;
  _createdAt?: string;
  _lastLogin?: string;
  analytics?: {
    totalStudents: number;
    totalTeachers: number;
  };
  userStats?: {
    active: number;
    byRole: Record<string, number>;
  };
}

export interface ExpiryAlert {
  _id: string;
  institutionId: string;
  institutionName: string;
  daysUntilExpiry: number;
  expiryDate: string;
  plan: string;
  amount: number;
  autoRenew: boolean;
  status: 'pending' | 'renewed' | 'expired';
  reminderSent: boolean;
  lastReminderDate?: string;
}

export interface OverduePayment {
  _id: string;
  institutionId: string;
  institutionName: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  plan: string;
  status: 'overdue' | 'paid' | 'cancelled';
  paymentMethod: string;
  reminderCount: number;
  lastReminderDate?: string;
}

export interface RenewalReminder {
  _id: string;
  institutionId: string;
  institutionName: string;
  expiryDate: string;
  daysUntilExpiry: number;
  plan: string;
  renewalAmount: number;
  status: 'scheduled' | 'sent' | 'acknowledged';
  nextReminderDate: string;
  reminderFrequency: 'daily' | 'weekly' | 'bi-weekly';
}

export interface AutoRenewSetting {
  _id: string;
  institutionId: string;
  institutionName: string;
  plan: string;
  autoRenew: boolean;
  paymentMethod: string;
  lastRenewalDate?: string;
  nextRenewalDate: string;
  renewalAmount: number;
  status: 'active' | 'paused' | 'failed';
}

export const superAdminService = {
  // Alerts
  getExpiryAlerts: async (): Promise<ExpiryAlert[]> => {
    try {
      const response = await apiService.get<ExpiryAlert[]>('/super-admin/expiry-alerts');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch expiry alerts');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to fetch expiry alerts:', error);
      throw error;
    }
  },

  getOverduePayments: async (): Promise<OverduePayment[]> => {
    try {
      const response = await apiService.get<OverduePayment[]>('/super-admin/overdue-payments');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch overdue payments');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to fetch overdue payments:', error);
      throw error;
    }
  },

  getRenewalReminders: async (): Promise<RenewalReminder[]> => {
    try {
      const response = await apiService.get<RenewalReminder[]>('/super-admin/renewal-reminders');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch renewal reminders');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to fetch renewal reminders:', error);
      throw error;
    }
  },

  getAutoRenewSettings: async (): Promise<AutoRenewSetting[]> => {
    try {
      const response = await apiService.get<AutoRenewSetting[]>('/super-admin/auto-renew');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch auto-renew settings');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to fetch auto-renew settings:', error);
      throw error;
    }
  },

  // Actions
  renewSubscription: async (institutionId: string, data: Record<string, unknown>): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiService.post<{ success: boolean; message: string }>(
        `/super-admin/renew/${institutionId}`,
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to renew subscription');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to renew subscription:', error);
      throw error;
    }
  },

  toggleAutoRenew: async (institutionId: string, enabled: boolean): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiService.put<{ success: boolean; message: string }>(
        `/super-admin/auto-renew/${institutionId}`,
        { enabled }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to toggle auto-renew');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to toggle auto-renew:', error);
      throw error;
    }
  },

  sendReminder: async (institutionId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiService.post<{ success: boolean; message: string }>(
        `/super-admin/send-reminder/${institutionId}`,
        {}
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to send reminder');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to send reminder:', error);
      throw error;
    }
  },

  reactivateInstitution: async (institutionId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiService.post<{ success: boolean; message: string }>(
        `/super-admin/reactivate/${institutionId}`,
        {}
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to reactivate institution');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to reactivate institution:', error);
      throw error;
    }
  },

  // Get institutions by type
  getInstitutionsByType: async (type: string): Promise<Institution[]> => {
    try {
      // Use working endpoint with type filter
      const response = await apiService.get<{institutions: Institution[], pagination: any}>('/institutions/working', { type });
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch institutions by type');
      }
      
      return (response.data.institutions || []).map((inst: any) => {
        const rawPlan = inst.plan;
        const plan = typeof rawPlan === 'string' ? rawPlan : (rawPlan?.name || 'Basic');
        const rawType = inst.type;
        const type = typeof rawType === 'string' ? rawType : (rawType?.name || 'School');
        return { ...inst, plan, type };
      });
    } catch (error) {
      console.error('Error fetching institutions by type:', error);
      throw error;
    }
  },

  // Institutions
  getInstitutions: async (): Promise<Institution[]> => {
    try {
      // Use list-all endpoint for all institutions
      const response = await apiService.get<{institutions: Institution[], pagination: any}>('/institutions/list-all');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch institutions');
      }
      
      // Extract institutions from the paginated response
      const institutionsData = response.data.institutions || [];
      
      // Transform mock data to match expected interface
      const transformedData = institutionsData.map((inst: any) => {
        const rawPlan = inst.plan;
        let plan: string;
        if (typeof rawPlan === 'string') {
          plan = rawPlan;
        } else if (rawPlan && typeof rawPlan === 'object' && rawPlan.name) {
          plan = rawPlan.name;
        } else {
          plan = 'Basic';
        }
        const rawType = inst.type;
        const type = typeof rawType === 'string' ? rawType : (rawType?.name || 'School');
        return {
          _id: inst._id,
          name: inst.name,
          code: inst.instituteCode || inst.code,
          instituteCode: inst.instituteCode || inst.code,
          type,
          email: inst.contactEmail || inst.email,
          phone: inst.contactPhone || inst.phone,
          address: inst.address,
          website: inst.website,
          status: inst.status.toLowerCase() as 'active' | 'inactive' | 'suspended' | 'pending' | 'closed',
          plan,
          subscriptionExpiry: inst.subscriptionExpiry,
          maxUsers: inst.maxUsers,
          currentUsers: inst.currentUsers,
          maxSchools: inst.maxSchools,
          currentSchools: inst.currentSchools,
          createdAt: inst.createdAt,
          updatedAt: inst.updatedAt,
          principalName: inst.principalName,
          principalEmail: inst.principalEmail,
          principalPhone: inst.principalPhone
        }
      });
      
      return transformedData;
    } catch (error) {
      console.error('[Super Admin Service] Failed to fetch institutions:', error);
      throw error;
    }
  },

  getAlertsSummary: async (): Promise<Record<string, unknown>> => {
    try {
      const response = await apiService.get<Record<string, unknown>>('/super-admin/alerts-summary');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch alerts summary');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to fetch alerts summary:', error);
      throw error;
    }
  },

  // Analytics
  getAnalyticsSummary: async (): Promise<Record<string, unknown>> => {
    try {
      const response = await apiService.get<Record<string, unknown>>('/super-admin/analytics/summary');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch analytics summary');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to fetch analytics summary:', error);
      throw error;
    }
  },

  getInstitutionsAnalytics: async (): Promise<Record<string, unknown>> => {
    try {
      const response = await apiService.get<Record<string, unknown>>('/super-admin/analytics/institutions');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch institutions analytics');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to fetch institutions analytics:', error);
      throw error;
    }
  },

  getRevenueAnalytics: async (): Promise<Record<string, unknown>> => {
    try {
      const response = await apiService.get<Record<string, unknown>>('/super-admin/analytics/revenue');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch revenue analytics');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to fetch revenue analytics:', error);
      throw error;
    }
  },

  getUserAnalytics: async (): Promise<Record<string, unknown>> => {
    try {
      const response = await apiService.get<Record<string, unknown>>('/super-admin/analytics/users');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch user analytics');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to fetch user analytics:', error);
      throw error;
    }
  },

  getBranchAnalytics: async (): Promise<Record<string, unknown>> => {
    try {
      const response = await apiService.get<Record<string, unknown>>('/super-admin/analytics/branches');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch branch analytics');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to fetch branch analytics:', error);
      throw error;
    }
  },

  getSubscriptionAnalytics: async (): Promise<Record<string, unknown>> => {
    try {
      const response = await apiService.get<Record<string, unknown>>('/super-admin/analytics/subscriptions');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch subscription analytics');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to fetch subscription analytics:', error);
      throw error;
    }
  },

  getSupportAnalytics: async (): Promise<Record<string, unknown>> => {
    try {
      const response = await apiService.get<Record<string, unknown>>('/super-admin/analytics/support');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch support analytics');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to fetch support analytics:', error);
      throw error;
    }
  },

  // Audit Logs
  getAuditLogs: async (params?: Record<string, unknown>): Promise<Record<string, unknown>[]> => {
    try {
      const response = await apiService.get<Record<string, unknown>[]>('/super-admin/audit-logs', params);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch audit logs');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to fetch audit logs:', error);
      throw error;
    }
  },

  getAuditLogSummary: async (): Promise<Record<string, unknown>> => {
    try {
      const response = await apiService.get<Record<string, unknown>>('/super-admin/audit-logs/summary');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch audit log summary');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to fetch audit log summary:', error);
      throw error;
    }
  },

  // Branch Details
  getBranchDetails: async (branchId: string): Promise<Record<string, unknown>> => {
    try {
      const response = await apiService.get<Record<string, unknown>>(`/super-admin/branches/${branchId}`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch branch details');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to fetch branch details:', error);
      throw error;
    }
  },

  getBranchStudents: async (branchId: string): Promise<Record<string, unknown>[]> => {
    try {
      const response = await apiService.get<Record<string, unknown>[]>(`/super-admin/branches/${branchId}/students`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch branch students');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to fetch branch students:', error);
      throw error;
    }
  },

  // Pending Requests Management
  getPendingRequests: async (): Promise<Record<string, unknown>> => {
    try {
      const response = await apiService.get<Record<string, unknown>>('/super-admin/pending-requests');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch pending requests');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to fetch pending requests:', error);
      throw error;
    }
  },

  approveRequest: async (userId: string, data: { notes?: string; credentials?: { email: string; password: string; role: string } }): Promise<Record<string, unknown>> => {
    try {
      const response = await apiService.post<Record<string, unknown>>(`/super-admin/approve-request/${userId}`, data);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to approve request');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to approve request:', error);
      throw error;
    }
  },

  rejectRequest: async (userId: string, data: { reason?: string; notes?: string }): Promise<Record<string, unknown>> => {
    try {
      const response = await apiService.post<Record<string, unknown>>(`/super-admin/reject-request/${userId}`, data);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to reject request');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to reject request:', error);
      throw error;
    }
  },

  // Credentials Management
  createCredentials: async (userId: string, data: { email: string; password: string; role: string; permissions: string[] }): Promise<Record<string, unknown>> => {
    try {
      const response = await apiService.post<Record<string, unknown>>(`/super-admin/create-credentials/${userId}`, data);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create credentials');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to create credentials:', error);
      throw error;
    }
  },

  // Institution Management
  createInstitution: async (institutionData: Record<string, unknown>): Promise<Record<string, unknown>> => {
    try {
      // Use correct endpoint path
      const response = await apiService.post<Record<string, unknown>>('/institutions/working', institutionData);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create institution');
      }
      
      // Clear local cache and refresh institution list
      localStorage.removeItem('institutions_cache');
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to create institution:', error);
      throw error;
    }
  },

  getInstitutionById: async (id: string): Promise<Record<string, unknown>> => {
    try {
      const response = await apiService.get<Record<string, unknown>>(`/institutions/working/${id}`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch institution');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to fetch institution by ID:', error);
      throw error;
    }
  },

  updateInstitution: async (id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> => {
    try {
      const response = await apiService.put<Record<string, unknown>>(`/institutions/working/${id}`, data);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update institution');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to update institution:', error);
      throw error;
    }
  },

  deleteInstitution: async (id: string): Promise<void> => {
    try {
      const response = await apiService.delete<void>(`/institutions/working/${id}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete institution');
      }
    } catch (error) {
      console.error('[Super Admin Service] Failed to delete institution:', error);
      throw error;
    }
  },

  // Dashboard data
  getDashboardData: async (): Promise<Record<string, unknown>> => {
    try {
      const response = await apiService.get<Record<string, unknown>>('/super-admin/dashboard');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch dashboard data');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to fetch dashboard data:', error);
      throw error;
    }
  },

  // Agent Commission Methods
  getAllAgents: async (): Promise<Record<string, unknown>[]> => {
    try {
      const response = await apiService.get<any>('/super-admin/agents');
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch agents');
      }
      
      // Handle different response structures
      let agents: any[] = [];
      if (Array.isArray(response.data)) {
        agents = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        agents = response.data.data;
      } else if (response.data && response.data.agents) {
        agents = response.data.agents;
      }
      
      return agents;
    } catch (error) {
      console.error('[Super Admin Service] Failed to fetch agents:', error);
      throw error;
    }
  },

  getAgentAnalytics: async (): Promise<Record<string, unknown>> => {
    try {
      const response = await apiService.get<Record<string, unknown>>('/super-admin/agents/analytics');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch agent analytics');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to fetch agent analytics:', error);
      throw error;
    }
  },

  getAllCommissions: async (params?: { agentId?: string; status?: string }): Promise<Record<string, unknown>[]> => {
    try {
      const queryParams: Record<string, string> = {};
      if (params?.agentId) queryParams.agentId = params.agentId;
      if (params?.status) queryParams.status = params.status;
      
      const response = await apiService.get<Record<string, unknown>[]>('/super-admin/commissions', Object.keys(queryParams).length ? queryParams : undefined);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch commissions');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to fetch commissions:', error);
      throw error;
    }
  },

  getCommissionSummary: async (): Promise<Record<string, unknown>> => {
    try {
      const response = await apiService.get<Record<string, unknown>>('/super-admin/commissions/summary');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch commission summary');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to fetch commission summary:', error);
      throw error;
    }
  },

  getAllData: async (): Promise<Record<string, unknown>> => {
    try {
      const response = await apiService.get<Record<string, unknown>>('/super-admin/all-data');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch all data');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Super Admin Service] Failed to fetch all data:', error);
      throw error;
}
  }
};

export default superAdminService;
