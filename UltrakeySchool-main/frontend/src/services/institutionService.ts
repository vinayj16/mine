import apiService, { type ApiResponse } from './api';
import { API_ENDPOINTS } from '../config/api';

export interface InstitutionFormData {
  institutionName: string;
  institutionCode: string;
  institutionType: string;
  email: string;
  phoneNumber: string;
  alternatePhone?: string;
  website?: string;
  country: string;
  state: string;
  district: string;
  city: string;
  area?: string;
  fullAddress: string;
  pincode: string;
  googleMapsLocation?: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  password?: string;
  confirmPassword?: string;
  autoGeneratePassword: boolean;
  sendCredentialsByEmail: boolean;
  selectedPlan: string;
  billingType: string;
  startDate: string;
  endDate: string;
  isTrial: boolean;
  trialExpiryDate?: string;
  maxStudentsLimit: number;
  maxStaffLimit: number;
  storageLimit: number;
  selectedModules: string[];
  board?: string;
  classes?: string[];
  sections?: string;
  academicYearFormat?: string;
  streams?: string[];
  yearStructure?: string[];
  semesters?: string[];
  universityAffiliation?: string;
  coursesOffered?: string[];
  departments?: string[];
  semesterSystem?: boolean;
  timezone: string;
  currency: string;
  dateFormat: string;
  language: string;
  gradingSystem: string;
  attendanceCalculationType: string;
  primaryColor: string;
  secondaryColor: string;
  customDomain?: string;
  subdomain?: string;
  logo?: string;
  favicon?: string;
  emailHeaderLogo?: string;
  allowStudentLogin: boolean;
  allowParentLogin: boolean;
  require2FA: boolean;
  passwordPolicy: string;
  sessionTimeoutDuration: number;
  status: string;
  suspensionReason?: string;
  allowImpersonation: boolean;
  allowAPIAccess: boolean;
}

export interface Institution {
  adminContact: any;
  _id: string;
  name: string;
  shortName?: string;
  instituteCode?: string;
  type: string;
  category: string;
  established: number;
  contact: {
    name: string;
    email: string;
    phone: string;
    alternatePhone?: string;
    website?: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
  };
  principalName: string;
  principalEmail: string;
  principalPhone: string;
  subscription: {
    planId: string;
    planName: string;
    status: string;
    startDate: string;
    endDate: string;
    billingCycle: string;
    monthlyCost: number;
    currency: string;
  };
  features: {
    maxUsers: number;
    maxStudents: number;
    maxTeachers: number;
    storageLimit: number;
    customDomain: boolean;
    whiteLabel: boolean;
    advancedAnalytics: boolean;
    prioritySupport: boolean;
  };
  analytics?: {
    totalStudents: number;
    totalTeachers: number;
    activeUsers: number;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstitutionFilters {
  page?: number;
  limit?: number;
  type?: string;
  category?: string;
  status?: string;
  subscriptionStatus?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface PaginatedInstitutionResponse {
  institutions: Institution[];
  allInstitutions?: Institution[];
  globalCount?: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const transformFormDataToInstitution = (formData: InstitutionFormData): Record<string, unknown> => {
  const planIdMap: Record<string, string> = {
    'Basic': 'basic',
    'Professional': 'medium',
    'Premium': 'premium'
  };

  const billingCycleMap: Record<string, string> = {
    'Monthly': 'monthly',
    'Yearly': 'annual'
  };

  const categoryMap: Record<string, string> = {
    'School': 'secondary',
    'Inter College': 'higher-secondary',
    'Degree College': 'undergraduate',
    'Engineering College': 'undergraduate'
  };

  return {
    name: formData.institutionName,
    shortName: formData.institutionCode,
    institutionCode: formData.institutionCode,
    code: formData.institutionCode,
    type: formData.institutionType,
    category: categoryMap[formData.institutionType] || 'secondary',
    established: new Date().getFullYear(),
    contact: {
      email: formData.email,
      phone: formData.phoneNumber,
      alternatePhone: formData.alternatePhone || '',
      website: formData.website || '',
      address: {
        street: formData.fullAddress,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postalCode: formData.pincode
      }
    },
    principalName: formData.adminName,
    principalEmail: formData.adminEmail,
    principalPhone: formData.adminPhone,
    adminContact: {
      name: formData.adminName,
      email: formData.adminEmail,
      phone: formData.adminPhone
    },
    // Academic fields based on institution type
    board: formData.board || '',
    classes: formData.classes || [],
    streams: formData.streams || [],
    yearStructure: formData.yearStructure || [],
    semesters: formData.semesters || [],
    departments: formData.departments || [],
    universityAffiliation: formData.universityAffiliation || '',
    academicYearFormat: formData.academicYearFormat || 'YYYY-YY',
    sections: formData.sections || 'A,B,C',
    subscription: {
      planId: planIdMap[formData.selectedPlan] || 'basic',
      planName: formData.selectedPlan,
      status: formData.isTrial ? 'trial' : 'active',
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      billingCycle: billingCycleMap[formData.billingType] || 'monthly',
      monthlyCost: formData.selectedPlan === 'Premium' ? 16500 : formData.selectedPlan === 'Professional' ? 6500 : 2500,
      currency: 'INR',
      autoRenewal: true
    },
    features: {
      maxUsers: formData.maxStaffLimit + formData.maxStudentsLimit,
      maxStudents: formData.maxStudentsLimit,
      maxTeachers: formData.maxStaffLimit,
      storageLimit: formData.storageLimit,
      customDomain: !!formData.customDomain,
      whiteLabel: formData.selectedPlan === 'Premium',
      advancedAnalytics: formData.selectedPlan !== 'Basic',
      prioritySupport: formData.selectedPlan === 'Premium',
      trainingSessions: formData.selectedPlan === 'Premium' ? 5 : 0,
      integrations: formData.allowAPIAccess ? ['REST_API'] : []
    },
    analytics: {
      totalStudents: 0,
      totalTeachers: 0,
      totalStaff: 0,
      activeUsers: 0,
      monthlyActiveUsers: 0,
      loginFrequency: 0,
      growthRate: 0,
      retentionRate: 0
    },
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    workingHours: {
      start: '09:00',
      end: '17:00'
    },
    timezone: formData.timezone,
    status: formData.status.toLowerCase(),
    notes: formData.suspensionReason || '',
    tags: [],
    contactEmail: formData.email,
    contactPhone: formData.phoneNumber,
    plan: planIdMap[formData.selectedPlan] || 'basic',
    subscriptionExpiry: formData.endDate,
    maxUsers: formData.maxStaffLimit + formData.maxStudentsLimit,
    maxStudents: formData.maxStudentsLimit,
    maxTeachers: formData.maxStaffLimit
  };
};

const institutionService = {
  async createInstitution(formData: InstitutionFormData): Promise<Institution> {
    const institutionData = transformFormDataToInstitution(formData);
    
    try {
      const response: ApiResponse<Institution> = await apiService.post(
        API_ENDPOINTS.INSTITUTIONS.CREATE,
        institutionData
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create institution');
      }

      if (!response.data._id) {
        throw new Error('Invalid response: Institution id missing');
      }

      return response.data;
    } catch (error: any) {
      console.error('[InstitutionService] Create error:', error);
      throw new Error(error.message || 'Failed to create institution');
    }
  },

  async getInstitutions(params?: InstitutionFilters): Promise<PaginatedInstitutionResponse> {
    const queryParams: Record<string, string> = {};
    
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);
    if (params?.type) queryParams.type = params.type;
    if (params?.category) queryParams.category = params.category;
    if (params?.status) queryParams.status = params.status;
    if (params?.subscriptionStatus) queryParams.subscriptionStatus = params.subscriptionStatus;
    if (params?.sortBy) queryParams.sortBy = params.sortBy;
    if (params?.sortOrder) queryParams.sortOrder = params.sortOrder;
    
    // Use /list-all endpoint for better performance
    const response: ApiResponse<PaginatedInstitutionResponse> = await apiService.get(
      'institutions/list-all',
      queryParams
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch institutions');
    }
    
    return response.data;
  },

  async getInstitutionById(id: string): Promise<Institution> {
    const response: ApiResponse<Institution> = await apiService.get(
      API_ENDPOINTS.INSTITUTIONS.DETAIL(id)
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch institution');
    }
    
    return response.data;
  },

  async updateInstitution(id: string, updates: Partial<Institution>): Promise<Institution> {
    const response: ApiResponse<Institution> = await apiService.put(
      API_ENDPOINTS.INSTITUTIONS.UPDATE(id),
      updates
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update institution');
    }
    
    return response.data;
  },

  async deleteInstitution(id: string): Promise<Institution> {
    const response: ApiResponse<Institution> = await apiService.delete(
      API_ENDPOINTS.INSTITUTIONS.DELETE(id)
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to delete institution');
    }
    
    return response.data;
  },

  async searchInstitutions(query: string, limit?: number): Promise<Institution[]> {
    const params: Record<string, string> = { q: query };
    if (limit) params.limit = String(limit);
    
    const response: ApiResponse<Institution[]> = await apiService.get(
      `${API_ENDPOINTS.INSTITUTIONS.LIST}/search`,
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to search institutions');
    }
    
    return response.data;
  },

  async getInstitutionsByType(type: string): Promise<Institution[]> {
    const response: ApiResponse<Institution[]> = await apiService.get(
      `${API_ENDPOINTS.INSTITUTIONS.LIST}/type/${type}`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch institutions by type');
    }
    
    return response.data;
  },

  async getInstitutionsByCategory(category: string): Promise<Institution[]> {
    const response: ApiResponse<Institution[]> = await apiService.get(
      `${API_ENDPOINTS.INSTITUTIONS.LIST}/category/${category}`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch institutions by category');
    }
    
    return response.data;
  },

  async getInstitutionsBySubscriptionStatus(status: string): Promise<Institution[]> {
    const response: ApiResponse<Institution[]> = await apiService.get(
      `${API_ENDPOINTS.INSTITUTIONS.LIST}/subscription-status/${status}`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch institutions by subscription status');
    }
    
    return response.data;
  },

  async getExpiringSubscriptions(days?: number): Promise<Institution[]> {
    const params: Record<string, string> = {};
    if (days) params.days = String(days);
    
    const response: ApiResponse<Institution[]> = await apiService.get(
      `${API_ENDPOINTS.INSTITUTIONS.LIST}/expiring-subscriptions`,
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch expiring subscriptions');
    }
    
    return response.data;
  },

  async getSubscriptionAnalytics(): Promise<Record<string, unknown>> {
    const response: ApiResponse<Record<string, unknown>> = await apiService.get(
      `${API_ENDPOINTS.INSTITUTIONS.LIST}/analytics/subscriptions`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch subscription analytics');
    }
    
    return response.data;
  },

  async getComplianceStatus(): Promise<Record<string, unknown>> {
    const response: ApiResponse<Record<string, unknown>> = await apiService.get(
      `${API_ENDPOINTS.INSTITUTIONS.LIST}/analytics/compliance`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch compliance status');
    }
    
    return response.data;
  },

  async getInstitutionMetrics(id: string): Promise<Record<string, unknown>> {
    const response: ApiResponse<Record<string, unknown>> = await apiService.get(
      `${API_ENDPOINTS.INSTITUTIONS.DETAIL(id)}/metrics`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch institution metrics');
    }
    
    return response.data;
  },

  async getCurrentUserInstitution(): Promise<Institution> {
    // Get institution details from user's auth store or fetch from API
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      throw new Error('User not found in localStorage');
    }
    
    const user = JSON.parse(userStr);
    if (!user.institutionId) {
      throw new Error('User does not belong to any institution');
    }
    
    const response: ApiResponse<Institution> = await apiService.get(
      API_ENDPOINTS.INSTITUTIONS.DETAIL(user.institutionId)
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch institution details');
    }
    
    return response.data;
  },

  async getDashboardStats(): Promise<Record<string, unknown>> {
    const response: ApiResponse<Record<string, unknown>> = await apiService.get(
      `${API_ENDPOINTS.INSTITUTIONS.LIST}/dashboard/stats`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch dashboard stats');
    }
    
    return response.data;
  },

  async suspendInstitution(id: string, reason: string): Promise<Institution> {
    const response: ApiResponse<Institution> = await apiService.post(
      `${API_ENDPOINTS.INSTITUTIONS.DETAIL(id)}/suspend`,
      { reason }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to suspend institution');
    }
    
    return response.data;
  },

  async activateInstitution(id: string): Promise<Institution> {
    const response: ApiResponse<Institution> = await apiService.post(
      `${API_ENDPOINTS.INSTITUTIONS.DETAIL(id)}/activate`,
      {}
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to activate institution');
    }
    
    return response.data;
  },

  async updateNotes(id: string, notes: string): Promise<Institution> {
    const response: ApiResponse<Institution> = await apiService.put(
      `${API_ENDPOINTS.INSTITUTIONS.DETAIL(id)}/notes`,
      { notes }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update notes');
    }
    
    return response.data;
  },

  async addTag(id: string, tag: string): Promise<Institution> {
    const response: ApiResponse<Institution> = await apiService.post(
      `${API_ENDPOINTS.INSTITUTIONS.DETAIL(id)}/tags`,
      { tag }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to add tag');
    }
    
    return response.data;
  },

  async removeTag(id: string, tag: string): Promise<Institution> {
    const response: ApiResponse<Institution> = await apiService.delete(
      `${API_ENDPOINTS.INSTITUTIONS.DETAIL(id)}/tags`,
      { tag }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to remove tag');
    }
    
    return response.data;
  },

  async updateSubscription(id: string, subscriptionData: Record<string, unknown>): Promise<Institution> {
    const response: ApiResponse<Institution> = await apiService.put(
      `${API_ENDPOINTS.INSTITUTIONS.DETAIL(id)}/subscription`,
      subscriptionData
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update subscription');
    }
    
    return response.data;
  },

  async updateAnalytics(id: string, analyticsData: Record<string, unknown>): Promise<Institution> {
    const response: ApiResponse<Institution> = await apiService.put(
      `${API_ENDPOINTS.INSTITUTIONS.DETAIL(id)}/analytics`,
      analyticsData
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update analytics');
    }
    
    return response.data;
  },

  async updateCompliance(id: string, complianceData: Record<string, unknown>): Promise<Institution> {
    const response: ApiResponse<Institution> = await apiService.put(
      `${API_ENDPOINTS.INSTITUTIONS.DETAIL(id)}/compliance`,
      complianceData
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update compliance');
    }
    
    return response.data;
  },

  async updateLastLogin(id: string): Promise<void> {
    const response: ApiResponse<void> = await apiService.post(
      `${API_ENDPOINTS.INSTITUTIONS.DETAIL(id)}/login`,
      {}
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to update last login');
    }
  },

  async getRevenueReport(startDate?: string, endDate?: string): Promise<Record<string, unknown>> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response: ApiResponse<Record<string, unknown>> = await apiService.get(
      `${API_ENDPOINTS.INSTITUTIONS.LIST}/analytics/revenue`,
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch revenue report');
    }
    
    return response.data;
  },

  async updateExpiredSubscriptions(): Promise<{ updatedCount: number }> {
    const response: ApiResponse<{ updatedCount: number }> = await apiService.post(
      `${API_ENDPOINTS.INSTITUTIONS.LIST}/update-expired`,
      {}
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update expired subscriptions');
    }
    
    return response.data;
  },

  async migrateFromSchool(schoolId: string): Promise<Institution> {
    const response: ApiResponse<Institution> = await apiService.post(
      `${API_ENDPOINTS.INSTITUTIONS.LIST}/migrate/${schoolId}`,
      {}
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to migrate from school');
    }
    
    return response.data;
  },

  // Agent-specific methods
  async getAgentInstitutions(agentId?: string): Promise<PaginatedInstitutionResponse> {
    const params: Record<string, string> = {};
    if (agentId) params.agentId = agentId;
    
    const response: ApiResponse<PaginatedInstitutionResponse> = await apiService.get(
      API_ENDPOINTS.AGENT_INSTITUTIONS.LIST,
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch agent institutions');
    }
    
    return response.data;
  },

  async createAgentInstitution(formData: InstitutionFormData, agentId?: string): Promise<Institution> {
    const institutionData = transformFormDataToInstitution(formData);
    
    try {
      const endpoint = agentId 
        ? `${API_ENDPOINTS.AGENT_INSTITUTIONS.CREATE}?agentId=${agentId}`
        : API_ENDPOINTS.AGENT_INSTITUTIONS.CREATE;

      const response: ApiResponse<Institution> = await apiService.post(
        endpoint,
        institutionData
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create agent institution');
      }

      if (!response.data._id) {
        throw new Error('Invalid response: Institution id missing');
      }

      return response.data;
    } catch (error: any) {
      console.error('[InstitutionService] Create agent institution error:', error);
      throw new Error(error.message || 'Failed to create agent institution');
    }
  },

  async getAgentInstitutionById(id: string): Promise<Institution> {
    const response: ApiResponse<Institution> = await apiService.get(
      API_ENDPOINTS.AGENT_INSTITUTIONS.DETAIL(id)
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch agent institution');
    }
    
    return response.data;
  },

  async updateAgentInstitution(id: string, updates: Partial<Institution>): Promise<Institution> {
    const response: ApiResponse<Institution> = await apiService.put(
      API_ENDPOINTS.AGENT_INSTITUTIONS.UPDATE(id),
      updates
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update agent institution');
    }
    
    return response.data;
  },

  async deleteAgentInstitution(id: string): Promise<void> {
    const response: ApiResponse<void> = await apiService.delete(
      API_ENDPOINTS.AGENT_INSTITUTIONS.DELETE(id)
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete agent institution');
    }
  },

  // ─── Dashboard Analytics Methods ──────────────────────────────────────────

  async getInstitutionDashboardStats(institutionId: string): Promise<Record<string, unknown>> {
    const response: ApiResponse<Record<string, unknown>> = await apiService.get(
      `/institutions/${institutionId}/dashboard/stats`
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch dashboard stats');
    }
    
    return response.data || {};
  },

  async getInstitutionAdmissions(institutionId: string): Promise<Record<string, unknown>> {
    const response: ApiResponse<Record<string, unknown>> = await apiService.get(
      `/institutions/${institutionId}/admissions/summary`
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch admissions data');
    }
    
    return response.data || {};
  },

  async getInstitutionFees(institutionId: string): Promise<Record<string, unknown>> {
    const response: ApiResponse<Record<string, unknown>> = await apiService.get(
      `/institutions/${institutionId}/fees/summary`
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch fees data');
    }
    
    return response.data || {};
  },

  async getInstitutionAttendance(institutionId: string): Promise<Record<string, unknown>> {
    const response: ApiResponse<Record<string, unknown>> = await apiService.get(
      `/institutions/${institutionId}/attendance/summary`
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch attendance data');
    }
    
    return response.data || {};
  },

  async getInstitutionStaff(institutionId: string): Promise<Record<string, unknown>> {
    const response: ApiResponse<Record<string, unknown>> = await apiService.get(
      `/institutions/${institutionId}/staff/summary`
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch staff data');
    }
    
    return response.data || {};
  },

  async getInstitutionExams(institutionId: string): Promise<Record<string, unknown>> {
    const response: ApiResponse<Record<string, unknown>> = await apiService.get(
      `/institutions/${institutionId}/exams/summary`
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch exams data');
    }
    
    return response.data || {};
  },

  async getInstitutionTransport(institutionId: string): Promise<Record<string, unknown>> {
    const response: ApiResponse<Record<string, unknown>> = await apiService.get(
      `/institutions/${institutionId}/transport/summary`
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch transport data');
    }
    
    return response.data || {};
  },

  async getInstitutionAlerts(institutionId: string): Promise<Record<string, unknown>> {
    const response: ApiResponse<Record<string, unknown>> = await apiService.get(
      `/institutions/${institutionId}/alerts/summary`
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch alerts data');
    }
    
    return response.data || {};
  },

  async getInstitutionLeaveRequests(institutionId: string): Promise<Record<string, unknown>[]> {
    const response: ApiResponse<Record<string, unknown>[]> = await apiService.get(
      `/institutions/${institutionId}/leave-requests`
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch leave requests');
    }
    
    return response.data || [];
  },

  async getInstitutionNotifications(institutionId: string): Promise<Record<string, unknown>[]> {
    const response: ApiResponse<Record<string, unknown>[]> = await apiService.get(
      `/institutions/${institutionId}/notifications`
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch notifications');
    }
    
    return response.data || [];
  },

  async getInstitutionTimetable(institutionId: string, className?: string): Promise<Record<string, unknown>> {
    const params = className ? `?class=${className}` : '';
    const response: ApiResponse<Record<string, unknown>> = await apiService.get(
      `/institutions/${institutionId}/timetable${params}`
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch timetable');
    }
    
    return response.data || {};
  }
};

export default institutionService;
