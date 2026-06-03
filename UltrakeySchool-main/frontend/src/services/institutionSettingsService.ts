import apiService, { type ApiResponse } from './api';

const BASE = '/institution-settings';

export interface InstitutionBranding {
  logo?: string;
  favicon?: string;
  emailHeaderLogo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  customCSS?: string;
}

export interface InstitutionEmailSettings {
  activeProvider: 'smtp' | 'phpMailer' | 'google' | 'none';
  isActive: boolean;
  smtp?: {
    enabled: boolean;
    host: string;
    port: number;
    username: string;
    password: string; // may be '********' when reading
    encryption: 'tls' | 'ssl' | 'none';
    fromEmail: string;
    fromName: string;
  } | null;
  phpMailer?: {
    enabled: boolean;
    host: string;
    port: number;
    username: string;
    password: string;
    encryption: 'tls' | 'ssl' | 'none';
    fromEmail: string;
    fromName: string;
  } | null;
  google?: {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    fromEmail: string;
    fromName: string;
  } | null;
}

export interface PaymentGatewaySummary {
  _id?: string;
  name: string;
  displayName: string;
  description?: string;
  logo?: string;
  isEnabled: boolean;
  isConnected: boolean;
  publicKey?: string;
  environment?: 'sandbox' | 'production';
  hasApiKey: boolean;
  hasApiSecret: boolean;
  hasMerchantId: boolean;
  hasWebhookSecret: boolean;
}

export interface InstitutionSupport {
  email: string;
  phone: string;
  helpdeskUrl: string;
  hours: string;
  whatsapp: string;
  telegram: string;
  address: string;
}

export interface DailyLoginBucket {
  date: string; // YYYY-MM-DD
  count: number;
  users: Array<{ userId: string; name?: string; role?: string; timestamp?: string }>;
}

export interface LoginActivity {
  dailyLogins: DailyLoginBucket[];
  totalLogins: number;
  lastLoginAt: string | null;
  uniqueLoginsLast30Days: number;
}

export interface InstitutionSettingsBundle {
  profile: {
    name: string;
    code: string;
    type: string;
    email: string;
    phone: string;
    website: string;
    address: { street: string; city: string; state: string; country: string; postalCode: string };
    principalName: string;
    principalEmail: string;
    principalPhone: string;
    status: string;
  };
  branding: InstitutionBranding;
  email: InstitutionEmailSettings;
  paymentGateways: PaymentGatewaySummary[];
  support: InstitutionSupport;
  loginActivity: LoginActivity;
}

const institutionSettingsService = {
  async getSettings(institutionId: string): Promise<InstitutionSettingsBundle> {
    const res: ApiResponse<InstitutionSettingsBundle> = await apiService.get(`${BASE}/${institutionId}/settings`);
    if (!res.success || !res.data) throw new Error(res.message || 'Failed to fetch settings');
    return res.data;
  },

  async getPublicBranding(institutionId: string): Promise<{ name: string; shortName?: string; instituteCode?: string; branding: InstitutionBranding; support: InstitutionSupport | null }> {
    const res = await apiService.get(`${BASE}/${institutionId}/branding/public`);
    if (!res.success || !res.data) throw new Error(res.message || 'Failed to fetch branding');
    return res.data;
  },

  async updateProfile(institutionId: string, profile: Partial<InstitutionSettingsBundle['profile']>): Promise<unknown> {
    const res = await apiService.put(`${BASE}/${institutionId}/profile`, profile);
    if (!res.success) throw new Error(res.message || 'Failed to update profile');
    return res.data;
  },

  async updateBranding(institutionId: string, branding: Partial<InstitutionBranding>): Promise<InstitutionBranding> {
    const res = await apiService.put(`${BASE}/${institutionId}/branding`, branding);
    if (!res.success) throw new Error(res.message || 'Failed to update branding');
    return res.data;
  },

  async updateEmailConfig(institutionId: string, email: Partial<InstitutionEmailSettings>): Promise<unknown> {
    const res = await apiService.put(`${BASE}/${institutionId}/email-config`, email);
    if (!res.success) throw new Error(res.message || 'Failed to update email config');
    return res.data;
  },

  async updatePaymentGateway(institutionId: string, gateway: Partial<PaymentGatewaySummary> & { credentials?: Record<string, string> }, action: 'upsert' | 'delete' = 'upsert'): Promise<unknown> {
    const res = await apiService.put(`${BASE}/${institutionId}/payment-gateway`, { gateway, action });
    if (!res.success) throw new Error(res.message || 'Failed to update payment gateway');
    return res.data;
  },

  async updateSupport(institutionId: string, support: Partial<InstitutionSupport>): Promise<InstitutionSupport> {
    const res = await apiService.put(`${BASE}/${institutionId}/support`, support);
    if (!res.success) throw new Error(res.message || 'Failed to update support');
    return res.data;
  },

  async getLoginActivity(institutionId: string): Promise<LoginActivity> {
    const res = await apiService.get(`${BASE}/${institutionId}/login-activity`);
    if (!res.success || !res.data) throw new Error(res.message || 'Failed to fetch login activity');
    return res.data;
  }
};

export default institutionSettingsService;

