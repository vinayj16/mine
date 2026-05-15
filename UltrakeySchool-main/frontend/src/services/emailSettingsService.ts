import apiService, { type ApiResponse } from './api';

export interface EmailSettings {
  institutionId: string;
  phpmailer: PhpMailerSettings;
  smtp: SmtpSettings;
  google: GoogleSettings;
  activeProvider: 'phpmailer' | 'smtp' | 'google';
  createdAt: string;
  updatedAt: string;
}

export interface PhpMailerSettings {
  enabled: boolean;
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  replyToName?: string;
}

export interface SmtpSettings {
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: 'tls' | 'ssl' | 'none';
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  replyToName?: string;
}

export interface GoogleSettings {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  replyToName?: string;
}

export interface PhpMailerSettingsInput {
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  replyToName?: string;
}

export interface SmtpSettingsInput {
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: 'tls' | 'ssl' | 'none';
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  replyToName?: string;
}

export interface GoogleSettingsInput {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  replyToName?: string;
}

export interface EmailTestResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export const emailSettingsService = {
  getEmailSettings: async (institutionId: string): Promise<EmailSettings> => {
    const response: ApiResponse<EmailSettings> = await apiService.get(
      '/email-settings',
      { institutionId }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch email settings');
    }
    
    return response.data;
  },    

  updatePhpMailerSettings: async (institutionId: string, data: PhpMailerSettingsInput): Promise<EmailSettings> => {
    const response: ApiResponse<EmailSettings> = await apiService.put(
      '/email-settings/phpmailer',
      { institutionId, ...data }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update PHPMailer settings');
    }
    
    return response.data;
  },

  updateSmtpSettings: async (institutionId: string, data: SmtpSettingsInput): Promise<EmailSettings> => {
    const response: ApiResponse<EmailSettings> = await apiService.put(
      '/email-settings/smtp',
      { institutionId, ...data }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update SMTP settings');
    }
    
    return response.data;
  },

  updateGoogleSettings: async (institutionId: string, data: GoogleSettingsInput): Promise<EmailSettings> => {
    const response: ApiResponse<EmailSettings> = await apiService.put(
      '/email-settings/google',
      { institutionId, ...data }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update Google settings');
    }
    
    return response.data;
  },

  toggleProvider: async (
    institutionId: string,
    provider: 'phpmailer' | 'smtp' | 'google',
    enabled: boolean
  ): Promise<EmailSettings> => {
    const response: ApiResponse<EmailSettings> = await apiService.post(
      '/email-settings/toggle',
      { institutionId, provider, enabled }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to toggle email provider');
    }
    
    return response.data;
  },

  testEmailConnection: async (
    institutionId: string,
    provider: 'phpmailer' | 'smtp' | 'google'
  ): Promise<EmailTestResult> => {
    const response: ApiResponse<EmailTestResult> = await apiService.get(
      `/email-settings/test/${provider}`,
      { institutionId }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to test email connection');
    }
    
    return response.data;
  }
};

export default emailSettingsService;
