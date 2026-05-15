import apiService from './api';

export interface Agent {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  commissionRate: number;
  status: 'Active' | 'Suspended' | 'Inactive';
  performance: 'Excellent' | 'Good' | 'Average' | 'Poor';
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    name: string;
    email: string;
  };
  updatedBy?: {
    name: string;
    email: string;
  };
}

export interface AgentSettings {
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    commissionAlerts: boolean;
    newInstitutionAlerts: boolean;
    performanceReports: boolean;
  };
  privacy: {
    showProfileToPublic: boolean;
    showPerformanceStats: boolean;
    allowContactRequests: boolean;
  };
  preferences: {
    language: string;
    timezone: string;
    dateFormat: string;
    currency: string;
    theme: 'light' | 'dark' | 'auto';
  };
  security: {
    notifications: boolean;
    emails: boolean;
    sms: boolean;
    twoFactorAuth: boolean;
    sessionTimeout: number;
    lastPasswordChange: string;
  };
}

export interface CreateAgentInput {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  commissionRate: number;
  status: 'Active' | 'Suspended' | 'Inactive';
  notes: string;
}

export interface UpdateAgentInput extends Partial<CreateAgentInput> {
  _id: string;
}

export const agentService = {
  // Get all agents with pagination
  getAll: async (page: number = 1, limit: number = 10, search?: string): Promise<{
    map(arg0: (agent: { _id: any; createdAt: any; }) => { id: any; joinDate: any; institutionsCreated: number; institutions: never[]; totalRevenue: number; lastLogin: undefined; _id: any; createdAt: any; }): import("../data/agents").Agent[] | PromiseLike<import("../data/agents").Agent[]>;
    agents: Agent[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalAgents: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (search) {
        params.append('search', search);
      }

      const response = await apiService.get<any>(`/super-admin/agents?${params}`);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch agents');
      }

      return response.data;
    } catch (error) {
      console.error('[Agent Service] Failed to fetch agents:', error);
      throw error;
    }
  },

  // Get all agents without pagination (for export)
  getAllWithoutPagination: async (): Promise<Agent[]> => {
    try {
      const response = await apiService.get<Agent[]>('/super-admin/agents/all');

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch agents');
      }

      return response.data;
    } catch (error) {
      console.error('[Agent Service] Failed to fetch agents:', error);
      throw error;
    }
  },

  // Get agent by ID
  getById: async (id: string): Promise<Agent> => {
    try {
      const response = await apiService.get<Agent>(`/super-admin/agents/${id}`);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch agent');
      }

      return response.data;
    } catch (error) {
      console.error('[Agent Service] Failed to fetch agent:', error);
      throw error;
    }
  },

  // Create new agent
  create: async (data: CreateAgentInput): Promise<Agent> => {
    try {
      const response = await apiService.post<Agent>('/super-admin/agents', data);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create agent');
      }

      return response.data;
    } catch (error) {
      console.error('[Agent Service] Failed to create agent:', error);
      throw error;
    }
  },

  // Update agent
  update: async (id: string, data: Partial<CreateAgentInput>): Promise<Agent> => {
    try {
      const response = await apiService.put<Agent>(`/super-admin/agents/${id}`, data);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update agent');
      }

      return response.data;
    } catch (error) {
      console.error('[Agent Service] Failed to update agent:', error);
      throw error;
    }
  },

  // Delete agent
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiService.delete<{ success: boolean; message: string }>(`/super-admin/agents/${id}`);

      if (!response.success || !response.data) {
        throw new Error(response. message || 'Failed to delete agent');
      }

      return response.data;
    } catch (error) {
      console.error('[Agent Service] Failed to delete agent:', error);
      throw error;
    }
  },

  // Bulk update status
  bulkUpdateStatus: async (ids: string[], status: 'Active' | 'Suspended' | 'Inactive'): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiService.put<{ success: boolean; message: string }>(
        '/super-admin/agents/bulk-status',
        { ids, status }
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update agent statuses');
      }

      return response.data;
    } catch (error) {
      console.error('[Agent Service] Failed to bulk update agent statuses:', error);
      throw error;
    }
  },

  // Agent Settings
  getSettings: async (): Promise<AgentSettings> => {
    try {
      const response = await apiService.get<AgentSettings>('/agents/settings');
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch settings');
      }
      return response.data;
    } catch (error) {
      console.error('[Agent Service] Failed to fetch settings:', error);
      throw error;
    }
  },

  updateSettings: async (settings: Partial<AgentSettings>): Promise<AgentSettings> => {
    try {
      const response = await apiService.put<AgentSettings>('/agents/settings', settings);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update settings');
      }
      return response.data;
    } catch (error) {
      console.error('[Agent Service] Failed to update settings:', error);
      throw error;
    }
  },

  getNotificationsSettings: async (): Promise<AgentSettings['notifications']> => {
    try {
      const response = await apiService.get<AgentSettings['notifications']>('/agents/settings/notifications');
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch notifications settings');
      }
      return response.data;
    } catch (error) {
      console.error('[Agent Service] Failed to fetch notifications settings:', error);
      throw error;
    }
  },

  updateNotificationsSettings: async (settings: Partial<AgentSettings['notifications']>): Promise<AgentSettings['notifications']> => {
    try {
      const response = await apiService.put<AgentSettings['notifications']>('/agents/settings/notifications', settings);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update notifications settings');
      }
      return response.data;
    } catch (error) {
      console.error('[Agent Service] Failed to update notifications settings:', error);
      throw error;
    }
  },

  getPrivacySettings: async (): Promise<AgentSettings['privacy']> => {
    try {
      const response = await apiService.get<AgentSettings['privacy']>('/agents/settings/privacy');
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch privacy settings');
      }
      return response.data;
    } catch (error) {
      console.error('[Agent Service] Failed to fetch privacy settings:', error);
      throw error;
    }
  },

  updatePrivacySettings: async (settings: Partial<AgentSettings['privacy']>): Promise<AgentSettings['privacy']> => {
    try {
      const response = await apiService.put<AgentSettings['privacy']>('/agents/settings/privacy', settings);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update privacy settings');
      }
      return response.data;
    } catch (error) {
      console.error('[Agent Service] Failed to update privacy settings:', error);
      throw error;
    }
  },

  getPreferencesSettings: async (): Promise<AgentSettings['preferences']> => {
    try {
      const response = await apiService.get<AgentSettings['preferences']>('/agents/settings/preferences');
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch preferences settings');
      }
      return response.data;
    } catch (error) {
      console.error('[Agent Service] Failed to fetch preferences settings:', error);
      throw error;
    }
  },

  updatePreferencesSettings: async (settings: Partial<AgentSettings['preferences']>): Promise<AgentSettings['preferences']> => {
    try {
      const response = await apiService.put<AgentSettings['preferences']>('/agents/settings/preferences', settings);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update preferences settings');
      }
      return response.data;
    } catch (error) {
      console.error('[Agent Service] Failed to update preferences settings:', error);
      throw error;
    }
  },

  getSecuritySettings: async (): Promise<AgentSettings['security']> => {
    try {
      const response = await apiService.get<AgentSettings['security']>('/agents/settings/security');
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch security settings');
      }
      return response.data;
    } catch (error) {
      console.error('[Agent Service] Failed to fetch security settings:', error);
      throw error;
    }
  },

  updateSecuritySettings: async (settings: Partial<AgentSettings['security']>): Promise<AgentSettings['security']> => {
    try {
      const response = await apiService.put<AgentSettings['security']>('/agents/settings/security', settings);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update security settings');
      }
      return response.data;
    } catch (error) {
      console.error('[Agent Service] Failed to update security settings:', error);
      throw error;
    }
  },

  // Get agent details with statistics (for SuperAdmin)
  getAgentDetails: async (id: string): Promise<Agent & {
    statistics: {
      totalInstitutions: number;
      activeInstitutions: number;
      pendingInstitutions: number;
      suspendedInstitutions: number;
      totalCommission: number;
      pendingCommission: number;
      paidCommission: number;
      approvedCommission: number;
      commissionRate: number;
      totalRevenue: number;
      performanceScore: string;
    };
    recentInstitutions: any[];
    recentCommissions: any[];
    settings: AgentSettings;
  }> => {
    try {
      const response = await apiService.get<any>(`/super-admin/agents/${id}/details`);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch agent details');
      }
      return response.data;
    } catch (error) {
      console.error('[Agent Service] Failed to fetch agent details:', error);
      throw error;
    }
  },

  // Complete agent profile (after first login)
  completeProfile: async (profileData: {
    aadharCard?: string;
    panCard?: string;
    bankAccount?: {
      accountNumber: string;
      bankName: string;
      ifscCode: string;
      branchName?: string;
    };
    dateOfBirth?: string;
    gender?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relation: string;
    };
    profilePhoto?: string;
  }): Promise<{ success: boolean; profileComplete: boolean }> => {
    try {
      const response = await apiService.post<{ success: boolean; profileComplete: boolean }>('/agents/complete-profile', profileData);
      if (!response.success) {
        throw new Error(response.message || 'Failed to complete profile');
      }
      return response.data || { success: false, profileComplete: false };
    } catch (error) {
      console.error('[Agent Service] Failed to complete profile:', error);
      throw error;
    }
  },

  // Get agent's own profile
  getMyProfile: async () => {
    try {
      const response = await apiService.get<any>('/agents/profile/me');
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch profile');
      }
      return response.data;
    } catch (error) {
      console.error('[Agent Service] Failed to fetch my profile:', error);
      throw error;
    }
  },

  // Get agent's own institutions with commission data
  getMyInstitutions: async () => {
    try {
      const response = await apiService.get<any>('/agents/my-institutions');
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch institutions');
      }
      return response.data;
    } catch (error) {
      console.error('[Agent Service] Failed to fetch my institutions:', error);
      throw error;
    }
  },

  // Log agent activity
  logActivity: async (activity: {
    action: string;
    description: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, any>;
  }): Promise<void> => {
    try {
      await apiService.post('/agents/log-activity', activity);
    } catch (error) {
      console.error('[Agent Service] Failed to log activity:', error);
    }
  },

  // Get commissions for current agent
  getMyCommissions: async () => {
    try {
      const response = await apiService.get<any>('/commissions/agent/me');
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch commissions');
      }
      return response.data;
    } catch (error) {
      console.error('[Agent Service] Failed to fetch commissions:', error);
      throw error;
    }
  },

  // Get commission summary for current agent
  getMyCommissionSummary: async () => {
    try {
      const response = await apiService.get<any>('/commissions/agent/me/summary');
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch commission summary');
      }
      return response.data;
    } catch (error) {
      console.error('[Agent Service] Failed to fetch commission summary:', error);
      throw error;
    }
  },

  // Get all commissions (Super Admin)
  getAllCommissions: async (page: number = 1, limit: number = 50, status?: string, agentId?: string) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (status) params.append('status', status);
      if (agentId) params.append('agentId', agentId);

      const response = await apiService.get<any>(`/commissions/admin/all?${params}`);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch commissions');
      }
      return response.data;
    } catch (error) {
      console.error('[Agent Service] Failed to fetch all commissions:', error);
      throw error;
    }
  },

  // Get commissions by agent ID (Super Admin)
  getCommissionsByAgent: async (agentId: string) => {
    try {
      const response = await apiService.get<any>(`/commissions/admin/agent/${agentId}`);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch agent commissions');
      }
      return response.data;
    } catch (error) {
      console.error('[Agent Service] Failed to fetch agent commissions:', error);
      throw error;
    }
  },

  // Update commission status (Super Admin)
  updateCommissionStatus: async (id: string, status: string, paymentDate?: string, paymentMethod?: string, paymentReference?: string) => {
    try {
      const response = await apiService.patch<any>(`/commissions/${id}/status`, {
        status,
        paymentDate,
        paymentMethod,
        paymentReference
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to update commission status');
      }
      return response.data;
    } catch (error) {
      console.error('[Agent Service] Failed to update commission status:', error);
      throw error;
    }
  }
};

export default agentService;
