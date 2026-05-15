/**
 * Unified Plan Configuration for EduManage Pro
 * Defines subscription plans, their features, and limitations
 */

export interface Plan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  description: string;
  features: string[];
  enabledModules: string[];
  studentLimit: number;
  userLimit: number;
  allowedRoles: string[];
  color: string;
  icon: string;
  isPopular?: boolean;
  isRecommended?: boolean;
}

// Define all plans
export const PLANS: Plan[] = [
  // 🟢 BASIC (Small Schools)
  {
    id: 'basic',
    name: 'basic',
    displayName: 'Basic',
    price: 29,
    currency: 'USD',
    billingCycle: 'monthly',
    description: 'Perfect for small schools with essential management needs',
    features: [
      'Core dashboards',
      'Student management (≤100 students)',
      'Teacher management',
      'Basic academic management',
      'Student attendance',
      'Notice board & events',
      'Basic reports',
      'User & role management',
      'School settings'
    ],
    enabledModules: [
      'dashboards',
      'students',
      'teachers', 
      'academics',
      'attendance',
      'communication',
      'reports',
      'users',
      'settings'
    ],
    studentLimit: 100,
    userLimit: 5,
    allowedRoles: ['Admin', 'Teacher', 'Student'],
    color: 'success',
    icon: 'ti ti-sparkles'
  },

  // 🔵 MEDIUM (Most Schools)
  {
    id: 'medium',
    name: 'medium',
    displayName: 'Medium',
    price: 79,
    currency: 'USD',
    billingCycle: 'monthly',
    description: 'Ideal for growing schools with comprehensive management needs',
    features: [
      'Everything in Basic',
      'Parent & guardian management',
      'Exams & results',
      'Fees & accounts management',
      'Library management',
      'Full reporting suite',
      'Email & SMS integration',
      'Up to 500 students',
      'Up to 20 users'
    ],
    enabledModules: [
      'dashboards',
      'students',
      'parents',
      'teachers',
      'academics',
      'attendance',
      'exams',
      'fees',
      'accounts',
      'library',
      'communication',
      'reports',
      'users',
      'settings'
    ],
    studentLimit: 500,
    userLimit: 20,
    allowedRoles: ['Admin', 'Teacher', 'Student', 'Parent', 'Accountant', 'Librarian'],
    color: 'info',
    icon: 'ti ti-star',
    isPopular: true
  },

  // 🟣 PREMIUM (Big Schools)
  {
    id: 'premium',
    name: 'premium',
    displayName: 'Premium',
    price: 199,
    currency: 'USD',
    billingCycle: 'monthly',
    description: 'Complete solution for large schools and institutions',
    features: [
      'Everything in Medium',
      'Transport management',
      'Hostel management',
      'HR & payroll',
      'Advanced reporting',
      'Unlimited students',
      'Up to 100 users',
      'Custom branding',
      'Priority support',
      'API access',
      'Advanced integrations'
    ],
    enabledModules: [
      'dashboards',
      'students',
      'parents',
      'teachers',
      'academics',
      'attendance',
      'exams',
      'fees',
      'accounts',
      'library',
      'transport',
      'hostel',
      'hr',
      'communication',
      'reports',
      'users',
      'settings'
    ],
    studentLimit: 2000,
    userLimit: 100,
    allowedRoles: [
      'Admin', 
      'Teacher', 
      'Student', 
      'Parent', 
      'Accountant', 
      'HR', 
      'Librarian', 
      'Transport Manager', 
      'Hostel Warden',
      'Principal',
      'Agent',
      'Staff Member'
    ],
    color: 'danger',
    icon: 'ti ti-crown',
    isRecommended: true
  }
];

// Helper functions
export const getPlanById = (id: string): Plan | undefined => {
  return PLANS.find(plan => plan.id === id);
};

export const getPlanByName = (name: string): Plan | undefined => {
  return PLANS.find(plan => plan.name === name);
};

export const getEnabledPlans = (): Plan[] => {
  return PLANS; // All plans are enabled by default in the new structure
};

export const getPlansForComparison = (): Plan[] => {
  return PLANS.map(plan => ({
    ...plan,
    features: plan.features.map(feature => 
      feature.replace('Everything in Basic', 'Basic features')
            .replace('Everything in Medium', 'Medium features')
    )
  }));
};

export const getUpgradePath = (currentPlan: string): Plan[] => {
  const currentIndex = PLANS.findIndex(plan => plan.id === currentPlan);
  return PLANS.slice(currentIndex + 1);
};

export const canUpgradeTo = (currentPlan: string, targetPlan: string): boolean => {
  const current = getPlanById(currentPlan);
  const target = getPlanById(targetPlan);
  if (!current || !target) return false;
  
  const currentPrice = current.price;
  const targetPrice = target.price;
  return targetPrice > currentPrice;
};

export const isModuleEnabledForPlan = (moduleId: string, planId: string): boolean => {
  const plan = getPlanById(planId);
  if (!plan) return false;
  return plan.enabledModules.includes(moduleId);
};

export const getAvailableModulesForPlan = (planId: string): string[] => {
  const plan = getPlanById(planId);
  if (!plan) return [];
  return plan.enabledModules;
};

export const getPlanComparison = (): { [key: string]: boolean[] } => {
  const allFeatures = [
    'Core dashboards',
    'Student management',
    'Teacher management', 
    'Parent & guardian management',
    'Academic management',
    'Attendance management',
    'Exams & results',
    'Fees & accounts',
    'Library management',
    'Transport management',
    'Hostel management',
    'HR & payroll',
    'Communication tools',
    'Advanced reporting',
    'User & role management',
    'School settings',
    'Custom branding',
    'API access',
    'Priority support'
  ];

  return PLANS.reduce((acc, plan) => {
    acc[plan.id] = allFeatures.map(feature => {
      switch (plan.id) {
        case 'basic':
          return [
            'Core dashboards',
            'Student management',
            'Teacher management',
            'Academic management',
            'Attendance management',
            'Communication tools',
            'Basic reporting',
            'User & role management',
            'School settings'
          ].includes(feature);
        
        case 'medium':
          return [
            'Core dashboards',
            'Student management',
            'Teacher management',
            'Parent & guardian management',
            'Academic management',
            'Attendance management',
            'Exams & results',
            'Fees & accounts',
            'Library management',
            'Communication tools',
            'Full reporting',
            'User & role management',
            'School settings'
          ].includes(feature);
        
        case 'premium':
          return true; // Premium has all features
        
        default:
          return false;
      }
    });
    return acc;
  }, {} as { [key: string]: boolean[] });
};

export const getYearlyPrice = (planId: string): number => {
  const plan = getPlanById(planId);
  if (!plan) return 0;
  
  // Apply 20% discount for yearly billing
  return plan.price * 12 * 0.8;
};

export const canRoleAccessPlan = (roleId: string, planId: string): boolean => {
  const plan = getPlanById(planId);
  if (!plan) return false;
  return plan.allowedRoles.includes(roleId);
};

export const getPlanFeaturesSummary = (planId: string): string[] => {
  const plan = getPlanById(planId);
  if (!plan) return [];
  
  const features: string[] = [];
  
  if (plan.studentLimit > 0) {
    features.push(`Up to ${plan.studentLimit} students`);
  } else {
    features.push('Unlimited students');
  }
  
  if (plan.userLimit > 0) {
    features.push(`Up to ${plan.userLimit} users`);
  } else {
    features.push('Unlimited users');
  }
  
  features.push(`${plan.enabledModules.length} modules`);
  features.push(`${plan.allowedRoles.length} role types`);
  
  if (plan.isPopular) {
    features.push('Most Popular');
  }
  
  if (plan.isRecommended) {
    features.push('Recommended');
  }
  
  return features;
};
