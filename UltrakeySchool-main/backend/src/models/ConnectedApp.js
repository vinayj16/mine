import mongoose from 'mongoose';

const connectedAppSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: false // Global apps don't need tenantId
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
    required: true
  },
  logo: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['communication', 'productivity', 'development', 'calendar', 'email', 'other'],
    default: 'other'
  },
  isConnected: {
    type: Boolean,
    default: false
  },
  isGlobal: {
    type: Boolean,
    default: true // Global apps are available to all tenants
  },
  connectedAt: {
    type: Date,
    default: null
  },
  connectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  credentials: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  webhookUrl: {
    type: String,
    default: null
  },
  apiKey: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for faster queries
connectedAppSchema.index({ tenantId: 1, name: 1 });
connectedAppSchema.index({ isGlobal: 1 });

const ConnectedApp = mongoose.model('ConnectedApp', connectedAppSchema);

export default ConnectedApp;
