import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  planId: {
    type: String,
    enum: ['basic', 'medium', 'premium'],
    required: true
  },
  planName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'expired', 'cancelled', 'trial', 'pending'],
    default: 'pending'
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  trialEndDate: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancelReason: {
    type: String
  },
  features: [{
    type: String
  }],
  enabledModules: [{
    type: String
  }],
  limits: {
    studentLimit: {
      type: Number,
      required: true
    },
    userLimit: {
      type: Number,
      required: true
    }
  },
  usage: {
    studentCount: {
      type: Number,
      default: 0
    },
    userCount: {
      type: Number,
      default: 0
    }
  },
  paymentMethod: {
    type: {
      type: String,
      enum: ['card', 'bank_transfer', 'paypal', 'other']
    },
    lastFour: String,
    brand: String
  },
  discount: {
    code: String,
    percentage: Number,
    amount: Number,
    validUntil: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

subscriptionSchema.index({ schoolId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ status: 1 });

subscriptionSchema.methods.isExpired = function() {
  return this.endDate < new Date();
};

subscriptionSchema.methods.isExpiringSoon = function(days = 7) {
  const daysUntilExpiry = Math.ceil((this.endDate - new Date()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= days && daysUntilExpiry > 0;
};

subscriptionSchema.methods.canUpgradeTo = function(targetPlanId) {
  const planHierarchy = { basic: 1, medium: 2, premium: 3 };
  return planHierarchy[targetPlanId] > planHierarchy[this.planId];
};

export default mongoose.model('Subscription', subscriptionSchema);
