import apiService from './api';

const API_URL = 'school-settings';

export interface BasicInfo {
  schoolName: string;
  phoneNumber?: string;
  email?: string;
  fax?: string;
  address?: string;
  website?: string;
}

export interface SchoolSettings {
  _id: string;
  institutionId: string;
  basicInfo: BasicInfo;
  academicSettings?: any;
  examSettings?: any;
  attendanceSettings?: any;
  feeSettings?: any;
  notificationSettings?: any;
  logo?: {
    url?: string;
    publicId?: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

const schoolSettingsService = {
  // Get school settings by institution ID
  getByInstitution: async (institutionId: string): Promise<SchoolSettings> => {
    const response = await apiService.get<SchoolSettings>(`${API_URL}/institution/${institutionId}`);
    if (!response.data) throw new Error('Settings not found');
    return response.data;
  },

  // Update basic info
  updateBasicInfo: async (institutionId: string, basicInfo: BasicInfo): Promise<SchoolSettings> => {
    const response = await apiService.patch<SchoolSettings>(`${API_URL}/institution/${institutionId}/basic-info`, basicInfo);
    if (!response.data) throw new Error('Update failed');
    return response.data;
  },

  // Create school settings
  create: async (data: Partial<SchoolSettings>): Promise<SchoolSettings> => {
    const response = await apiService.post<SchoolSettings>(API_URL, data);
    if (!response.data) throw new Error('Create failed');
    return response.data;
  },

  // Update entire school settings
  update: async (institutionId: string, data: Partial<SchoolSettings>): Promise<SchoolSettings> => {
    const response = await apiService.put<SchoolSettings>(`${API_URL}/institution/${institutionId}`, data);
    if (!response.data) throw new Error('Update failed');
    return response.data;
  }
};

export default schoolSettingsService;
