import mongoose from 'mongoose';

const membershipAddonSchema = new mongoose.Schema({
  addonId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
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
    enum: ['FEATURE', 'MODULE', 'STORAGE', 'USERS', 'SUPPORT', 'INTEGRATION', 'OTHER'],
    default: 'FEATURE'
  },
  limits: {
    students: {
      value: { type: Number, default: 0 },
      isUnlimited: { type: Boolean, default: false },
      isEnabled: { type: Boolean, default: true }
    },
    teachers: {
      value: { type: Number, default: 0 },
      isUnlimited: { type: Boolean, default: false },
      isEnabled: { type: Boolean, default: true }
    },
    classes: {
      value: { type: Number, default: 0 },
      isUnlimited: { type: Boolean, default: false },
      isEnabled: { type: Boolean, default: true }
    },
    sections: {
      value: { type: Number, default: 0 },
      isUnlimited: { type: Boolean, default: false },
      isEnabled: { type: Boolean, default: true }
    },
    subjects: {
      value: { type: Number, default: 0 },
      isUnlimited: { type: Boolean, default: false },
      isEnabled: { type: Boolean, default: true }
    },
    exams: {
      value: { type: Number, default: 0 },
      isUnlimited: { type: Boolean, default: false },
      isEnabled: { type: Boolean, default: true }
    },
    departments: {
      value: { type: Number, default: 0 },
      isUnlimited: { type: Boolean, default: false },
      isEnabled: { type: Boolean, default: true }
    },
    designations: {
      value: { type: Number, default: 0 },
      isUnlimited: { type: Boolean, default: false },
      isEnabled: { type: Boolean, default: true }
    },
    library: {
      value: { type: Number, default: 0 },
      isUnlimited: { type: Boolean, default: false },
      isEnabled: { type: Boolean, default: true }
    },
    transport: {
      value: { type: Number, default: 0 },
      isUnlimited: { type: Boolean, default: false },
      isEnabled: { type: Boolean, default: true }
    }
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  billingCycle: {
    type: String,
    enum: ['MONTHLY', 'YEARLY', 'ONE_TIME'],
    default: 'MONTHLY'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

membershipAddonSchema.index({ status: 1 });
membershipAddonSchema.index({ category: 1 });

export default mongoose.model('MembershipAddon', membershipAddonSchema);
