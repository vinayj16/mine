import apiService, { type ApiResponse } from './api';

export interface GdprSettings {
  institutionId: string;
  enabled: boolean;
  dataRetentionPeriod: {
    studentData: number;
    staffData: number;
    auditLogs: number;
    financialRecords: number;
  };
  consentManagement: {
    requireExplicitConsent: boolean;
    consentTypes: string[];
    consentExpiryDays: number;
  };
  dataProcessing: {
    allowThirdPartySharing: boolean;
    allowDataTransfer: boolean;
    allowAutomatedDecisions: boolean;
  };
  userRights: {
    allowDataExport: boolean;
    allowDataErasure: boolean;
    allowDataRectification: boolean;
    allowDataPortability: boolean;
  };
  notifications: {
    notifyOnDataBreach: boolean;
    notifyOnDataAccess: boolean;
    notifyOnDataExport: boolean;
    notifyOnDataErasure: boolean;
  };
  compliance: {
    dpoName?: string;
    dpoEmail?: string;
    dpoPhone?: string;
    privacyPolicyUrl?: string;
    termsOfServiceUrl?: string;
    lastAuditDate?: string;
    nextAuditDate?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateGdprSettingsInput {
  dataRetentionPeriod?: {
    studentData?: number;
    staffData?: number;
    auditLogs?: number;
    financialRecords?: number;
  };
  consentManagement?: {
    requireExplicitConsent?: boolean;
    consentTypes?: string[];
    consentExpiryDays?: number;
  };
  dataProcessing?: {
    allowThirdPartySharing?: boolean;
    allowDataTransfer?: boolean;
    allowAutomatedDecisions?: boolean;
  };
  userRights?: {
    allowDataExport?: boolean;
    allowDataErasure?: boolean;
    allowDataRectification?: boolean;
    allowDataPortability?: boolean;
  };
  notifications?: {
    notifyOnDataBreach?: boolean;
    notifyOnDataAccess?: boolean;
    notifyOnDataExport?: boolean;
    notifyOnDataErasure?: boolean;
  };
  compliance?: {
    dpoName?: string;
    dpoEmail?: string;
    dpoPhone?: string;
    privacyPolicyUrl?: string;
    termsOfServiceUrl?: string;
    lastAuditDate?: string;
    nextAuditDate?: string;
  };
}

export const gdprSettingsService = {
  getGdprSettings: async (institutionId: string): Promise<GdprSettings> => {
    const response: ApiResponse<GdprSettings> = await apiService.get(
      '/gdpr-settings',
      { institutionId }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch GDPR settings');
    }
    
    return response.data;
  },

  updateGdprSettings: async (institutionId: string, data: UpdateGdprSettingsInput): Promise<GdprSettings> => {
    const response: ApiResponse<GdprSettings> = await apiService.put(
      '/gdpr-settings',
      { institutionId, ...data }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update GDPR settings');
    }
    
    return response.data;
  },

  toggleGdpr: async (institutionId: string, enabled: boolean): Promise<GdprSettings> => {
    const response: ApiResponse<GdprSettings> = await apiService.post(
      '/gdpr-settings/toggle',
      { institutionId, enabled }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to toggle GDPR');
    }
    
    return response.data;
  },

  deleteGdprSettings: async (institutionId: string): Promise<void> => {
    const response: ApiResponse<void> = await apiService.delete(
      '/gdpr-settings',
      { institutionId }
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete GDPR settings');
    }
  }
};

export default gdprSettingsService;
