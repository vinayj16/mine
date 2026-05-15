import mongoose from 'mongoose';

const institutionContactSchema = new mongoose.Schema({
  email: { type: String, required: false },
  phone: { type: String, required: false },
  alternatePhone: String,
  website: String,
  fax: String,
  address: {
    street: { type: String, required: false },
    city: { type: String, required: false },
    state: { type: String, required: false },
    country: { type: String, required: false },
    postalCode: { type: String, required: false }
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  }
}, { _id: false });

const institutionSubscriptionSchema = new mongoose.Schema({
  planId: { type: String, enum: ['basic', 'medium', 'premium'], required: false },
  planName: { type: String, required: false },
  status: { 
    type: String, 
    enum: ['active', 'expired', 'cancelled', 'suspended', 'trial'], 
    default: 'active' 
  },
  startDate: { type: Date, required: false },
  endDate: { type: Date, required: false },
  renewalDate: Date,
  autoRenewal: { type: Boolean, default: true },
  billingCycle: { 
    type: String, 
    enum: ['monthly', 'quarterly', 'semi-annual', 'annual'], 
    default: 'monthly' 
  },
  monthlyCost: { type: Number, required: false },
  currency: { type: String, default: 'INR' },
  paymentMethod: { 
    type: String, 
    enum: ['card', 'bank', 'check', 'wire'] 
  },
  lastPaymentDate: Date,
  nextPaymentDate: Date,
  discount: {
    type: { type: String, enum: ['percentage', 'fixed'] },
    value: Number,
    description: String
  }
}, { _id: false });

const institutionFeaturesSchema = new mongoose.Schema({
  maxUsers: { type: Number, required: false },
  maxStudents: { type: Number, required: false },
  maxTeachers: { type: Number, required: false },
  storageLimit: { type: Number, required: false }, // in GB
  apiCallsLimit: Number,
  customDomain: { type: Boolean, default: false },
  whiteLabel: { type: Boolean, default: false },
  advancedAnalytics: { type: Boolean, default: false },
  prioritySupport: { type: Boolean, default: false },
  trainingSessions: { type: Number, default: 0 },
  integrations: [{ type: String }]
}, { _id: false });

const institutionAnalyticsSchema = new mongoose.Schema({
  totalStudents: { type: Number, default: 0 },
  totalTeachers: { type: Number, default: 0 },
  totalStaff: { type: Number, default: 0 },
  activeUsers: { type: Number, default: 0 },
  monthlyActiveUsers: { type: Number, default: 0 },
  loginFrequency: { type: Number, default: 0 },
  featureUsage: {
    attendance: Number,
    grades: Number,
    reports: Number,
    communication: Number,
    analytics: Number
  },
  growthRate: { type: Number, default: 0 },
  retentionRate: { type: Number, default: 0 },
  satisfactionScore: Number
}, { _id: false });

const institutionComplianceSchema = new mongoose.Schema({
  dataRetentionPolicy: { type: Boolean, default: false },
  gdprCompliant: { type: Boolean, default: false },
  hipaaCompliant: { type: Boolean, default: false },
  ferpaCompliant: { type: Boolean, default: false },
  securityAudits: { type: Boolean, default: false },
  backupFrequency: { type: String, default: 'weekly' },
  incidentResponsePlan: { type: Boolean, default: false },
  lastSecurityAudit: Date,
  dpoContact: { type: String, default: 'dpo@edumanage.pro' },
  dpoResponsibilities: {
    type: [String],
    default: [
      'Data protection compliance',
      'Breach notification',
      'DPIA coordination'
    ]
  },
  dpoContactInfoLocation: { type: String, default: 'privacy policy & system settings' },
  dpia: {
    highRiskProcessing: {
      type: [String],
      default: [
        'Student personal data processing',
        'Automated decision making for assessments',
        'Large-scale data processing'
      ]
    },
    mitigationMeasures: {
      type: [String],
      default: [
        'Data minimization implemented',
        'Privacy by design principles followed',
        'Regular DPIA reviews conducted',
        'Data protection officer appointed'
      ]
    },
    lastReview: Date
  }
}, { _id: false });

const institutionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
    trim: true
  },
  instituteCode: {
    type: String,
    required: false,
    unique: true,
    index: true
  },
  shortName: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['School', 'Inter College', 'Degree College', 'Engineering College'],
    required: false
  },
  category: {
    type: String,
    enum: ['primary', 'secondary', 'higher-secondary', 'undergraduate', 'postgraduate', 'professional'],
    required: false
  },
  accreditation: [{
    type: String
  }],
  established: {
    type: Number,
    required: false
  },
  description: String,

  // Contact & Location
  contact: {
    type: institutionContactSchema,
    required: true
  },

  // Administration
  principalName: {
    type: String,
    required: false
  },
  principalEmail: {
    type: String,
    required: false
  },
  principalPhone: {
    type: String,
    required: false
  },
  adminContact: {
    name: { type: String, required: false },
    email: { type: String, required: false },
    phone: { type: String, required: false }
  },

  // Admin & Principal References (for populate)
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  principalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },

  // Subscription & Billing
  subscription: {
    type: institutionSubscriptionSchema,
    required: false
  },

  // Features & Limits
  features: {
    type: institutionFeaturesSchema,
    required: false
  },

  // Analytics
  analytics: {
    type: institutionAnalyticsSchema,
    default: () => ({})
  },

  // Compliance & Security
  compliance: {
    type: institutionComplianceSchema,
    default: () => ({})
  },

  // Operational Data
  academicYear: {
    type: String,
    required: false
  },
  workingDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  workingHours: {
    start: { type: String, required: false },
    end: { type: String, required: false }
  },
  holidays: [{
    type: String
  }],
  timezone: {
    type: String,
    default: 'UTC'
  },

  // Financial
  annualBudget: Number,
  monthlyRevenue: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  outstandingPayments: {
    type: Number,
    default: 0
  },

  // System
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'trial', 'expired'],
    default: 'active'
  },
  tags: [{
    type: String
  }],
  notes: String,

  // Branding & Customization
  branding: {
    logo: {
      type: String
    },
    favicon: {
      type: String
    },
    primaryColor: {
      type: String,
      default: '#3b82f6'
    },
    secondaryColor: {
      type: String,
      default: '#64748b'
    },
    fontFamily: {
      type: String,
      default: 'Inter'
    },
    customCSS: {
      type: String
    }
  },

  // Legacy reference
  legacySchoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
institutionSchema.index({ name: 'text' });
institutionSchema.index({ type: 1 });
institutionSchema.index({ category: 1 });
institutionSchema.index({ status: 1 });
institutionSchema.index({ 'subscription.status': 1 });
institutionSchema.index({ 'subscription.endDate': 1 });

// Virtual for checking if subscription is expiring
institutionSchema.virtual('isSubscriptionExpiring').get(function() {
  if (!this.subscription || !this.subscription.endDate) return false;
  const daysUntilExpiry = Math.ceil((this.subscription.endDate - new Date()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
});

// Method to check if expired
institutionSchema.methods.isExpired = function() {
  return this.subscription && this.subscription.endDate < new Date();
};

// Method to check if subscription is active
institutionSchema.methods.isSubscriptionActive = function() {
  return this.subscription && 
    ['active', 'trial'].includes(this.subscription.status) && 
    this.subscription.endDate > new Date();
};

// Pre-save middleware to calculate total revenue
institutionSchema.pre('save', function(next) {
  if (this.subscription && this.subscription.monthlyCost) {
    this.monthlyRevenue = this.subscription.monthlyCost;
    const months = this.subscription.billingCycle === 'annual' ? 12 : 
                   this.subscription.billingCycle === 'semi-annual' ? 6 : 
                   this.subscription.billingCycle === 'quarterly' ? 3 : 1;
    this.totalRevenue = this.subscription.monthlyCost * months;
  }
  next();
});

// Add frontend-compatible fields
institutionSchema.add({
  // Frontend field aliases
  contactEmail: { type: String, sparse: true },
  contactPhone: { type: String, sparse: true },
  code: { type: String, sparse: true },
  plan: { type: String, sparse: true },
  subscriptionExpiry: { type: Date, sparse: true },
  maxUsers: { type: Number, sparse: true },
  maxStudents: { type: Number, sparse: true },
  maxTeachers: { type: Number, sparse: true },
  
  // Additional fields for frontend compatibility
  academicYear: { type: String, default: '2024-2025' },
  workingDays: [{ type: String }],
  workingHours: {
    start: { type: String, default: '08:00' },
    end: { type: String, default: '16:00' }
  }
});

export default mongoose.model('Institution', institutionSchema);
