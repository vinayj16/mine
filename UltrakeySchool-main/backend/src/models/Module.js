import mongoose from 'mongoose';

const featureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  enabled: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    required: true
  },
  isBeta: {
    type: Boolean,
    default: false
  },
  requiredPlan: {
    type: String,
    enum: ['Basic', 'Professional', 'Premium']
  }
});

const moduleSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  enabled: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: 'ti ti-package'
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ModuleCategory',
    required: true
  },
  institutionTypes: [{
    type: String,
    enum: ['School', 'Inter', 'Degree']
  }],
  plans: [{
    type: String,
    enum: ['Basic', 'Professional', 'Premium']
  }],
  features: [featureSchema],
  isBeta: {
    type: Boolean,
    default: false
  },
  version: {
    type: String,
    default: '1.0.0'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  mandatory: {
    type: Boolean,
    default: false
  },
  dependencyModules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Module', moduleSchema);
