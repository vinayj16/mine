import apiService, { type ApiResponse } from './api';
export interface InstitutionGrowth {
  monthly: Array<{ month: string; count: number; growth: number }>;
  yearly: Array<{ year: string; count: number; growth: number }>;
}

export interface RevenueGrowth {
  monthly: Array<{ month: string; revenue: number; growth: number }>;
  yearly: Array<{ year: string; revenue: number; growth: number }>;
}

export interface PlanDistribution {
  plan: string;
  count: number;
  percentage: number;
  revenue: number;
}

export interface InstitutionTypeDistribution {
  type: string;
  count: number;
  percentage: number;
}

export interface ChurnRate {
  current: number;
  previous: number;
  monthly: Array<{ month: string; rate: number }>;
}

export interface RenewalRate {
  current: number;
  previous: number;
  monthly: Array<{ month: string; rate: number }>;
}

export interface BranchGrowth {
  monthly: Array<{ month: string; count: number; growth: number }>;
  total: number;
}

export interface ModuleUsage {
  module: string;
  active: number;
  total: number;
  usage: number;
}

export interface SupportLoad {
  total: number;
  open: number;
  resolved: number;
  averageResolutionTime: number;
  byPriority: Array<{ priority: string; count: number }>;
  byCategory: Array<{ category: string; count: number }>;
}

export interface AnalyticsData {
  institutionGrowth: InstitutionGrowth;
  revenueGrowth: RevenueGrowth;
  planDistribution: PlanDistribution[];
  institutionTypeDistribution: InstitutionTypeDistribution[];
  churnRate: ChurnRate;
  renewalRate: RenewalRate;
  branchGrowth: BranchGrowth;
  moduleUsage: ModuleUsage[];
  supportLoad: SupportLoad;
}

const analyticsService = {
  /**
   * Get full analytics data
   * @returns Complete analytics data
   */
  async getFullAnalytics(): Promise<AnalyticsData> {
    const response: ApiResponse<AnalyticsData> = await apiService.get('/analytics');
    
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch analytics');
    }
    
    return response.data;
  },

  /**
   * Get institution growth analytics
   * @param period - Time period (monthly or yearly)
   * @returns Institution growth data
   */
  async getInstitutionGrowth(period: 'monthly' | 'yearly' = 'monthly'): Promise<InstitutionGrowth> {
    const response: ApiResponse<InstitutionGrowth> = await apiService.get(
      '/analytics/institution-growth',
      { period }
    );
    
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch institution growth');
    }
    
    return response.data;
  },

  /**
   * Get revenue growth analytics
   * @param period - Time period (monthly or yearly)
   * @returns Revenue growth data
   */
  async getRevenueGrowth(period: 'monthly' | 'yearly' = 'monthly'): Promise<RevenueGrowth> {
    const response: ApiResponse<RevenueGrowth> = await apiService.get(
      '/analytics/revenue-growth',
      { period }
    );
    
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch revenue growth');
    }
    
    return response.data;
  },

  /**
   * Get plan distribution analytics
   * @returns Plan distribution data
   */
  async getPlanDistribution(): Promise<PlanDistribution[]> {
    const response: ApiResponse<PlanDistribution[]> = await apiService.get(
      '/analytics/plan-distribution'
    );
    
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch plan distribution');
    }
    
    return response.data;
  },

  /**
   * Get institution type distribution analytics
   * @returns Institution type distribution data
   */
  async getInstitutionTypeDistribution(): Promise<InstitutionTypeDistribution[]> {
    const response: ApiResponse<InstitutionTypeDistribution[]> = await apiService.get(
      '/analytics/institution-type-distribution'
    );
    
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch institution type distribution');
    }
    
    return response.data;
  },

  /**
   * Get churn rate analytics
   * @returns Churn rate data
   */
  async getChurnRate(): Promise<ChurnRate> {
    const response: ApiResponse<ChurnRate> = await apiService.get('/analytics/churn-rate');
    
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch churn rate');
    }
    
    return response.data;
  },

  /**
   * Get renewal rate analytics
   * @returns Renewal rate data
   */
  async getRenewalRate(): Promise<RenewalRate> {
    const response: ApiResponse<RenewalRate> = await apiService.get('/analytics/renewal-rate');
    
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch renewal rate');
    }
    
    return response.data;
  },

  /**
   * Get branch growth analytics
   * @returns Branch growth data
   */
  async getBranchGrowth(): Promise<BranchGrowth> {
    const response: ApiResponse<BranchGrowth> = await apiService.get('/analytics/branch-growth');
    
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch branch growth');
    }
    
    return response.data;
  },

  /**
   * Get module usage analytics
   * @returns Module usage data
   */
  async getModuleUsage(): Promise<ModuleUsage[]> {
    const response: ApiResponse<ModuleUsage[]> = await apiService.get('/analytics/module-usage');
    
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch module usage');
    }
    
    return response.data;
  },

  /**
   * Get support load analytics
   * @returns Support load data
   */
  async getSupportLoad(): Promise<SupportLoad> {
    const response: ApiResponse<SupportLoad> = await apiService.get('/analytics/support-load');
    
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch support load');
    }
    
    return response.data;
  }
};

export default analyticsService;
