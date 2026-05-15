import mongoose from 'mongoose';

const membershipPlanSchema = new mongoose.Schema({
  planId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['starter', 'enterprise', 'premium', 'custom'],
    default: 'starter'
  },
  pricing: {
    monthly: {
      amount: { type: Number, required: true, default: 0 },
      currency: { type: String, default: 'USD' }
    },
    yearly: {
      amount: { type: Number, required: true, default: 0 },
      currency: { type: String, default: 'USD' }
    }
  },
  limits: {
    students: {
      value: { type: Number, default: 0 },
      isUnlimited: { type: Boolean, default: false }
    },
    teachers: {
      value: { type: Number, default: 0 },
      isUnlimited: { type: Boolean, default: false }
    },
    classes: {
      value: { type: Number, default: 0 },
      isUnlimited: { type: Boolean, default: false }
    },
    sections: {
      value: { type: Number, default: 0 },
      isUnlimited: { type: Boolean, default: false }
    },
    subjects: {
      value: { type: Number, default: 0 },
      isUnlimited: { type: Boolean, default: false }
    },
    exams: {
      value: { type: Number, default: 0 },
      isUnlimited: { type: Boolean, default: false }
    },
    departments: {
      value: { type: Number, default: 0 },
      isUnlimited: { type: Boolean, default: false }
    },
    designations: {
      value: { type: Number, default: 0 },
      isUnlimited: { type: Boolean, default: false }
    },
    library: {
      isEnabled: { type: Boolean, default: false }
    },
    transport: {
      isEnabled: { type: Boolean, default: false }
    },
    storage: {
      value: { type: Number, default: 50 },
      unit: { type: String, default: 'GB' }
    }
  },
  features: [{
    name: String,
    description: String,
    isEnabled: { type: Boolean, default: true }
  }],
  enabledModules: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  isRecommended: {
    type: Boolean,
    default: false
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  trialDays: {
    type: Number,
    default: 0
  },
  maxSchools: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

membershipPlanSchema.index({ status: 1 });
membershipPlanSchema.index({ category: 1 });
membershipPlanSchema.index({ sortOrder: 1 });

membershipPlanSchema.methods.getMonthlyPrice = function() {
  return this.pricing.monthly.amount;
};

membershipPlanSchema.methods.getYearlyPrice = function() {
  return this.pricing.yearly.amount;
};

membershipPlanSchema.methods.getYearlySavings = function() {
  const monthlyTotal = this.pricing.monthly.amount * 12;
  const yearlyTotal = this.pricing.yearly.amount;
  return monthlyTotal - yearlyTotal;
};

export default mongoose.model('MembershipPlan', membershipPlanSchema);
