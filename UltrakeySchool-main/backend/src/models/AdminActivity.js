import mongoose from 'mongoose';

const adminActivitySchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  resource: {
    type: String,
    required: true,
    trim: true
  },
  resourceType: {
    type: String,
    enum: ['school', 'user', 'subscription', 'ticket', 'module', 'setting', 'system', 'agent', 'institution', 'other'],
    required: true,
    index: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
    index: true
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'success',
    index: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  errorMessage: {
    type: String
  },
  duration: {
    type: Number
  }
}, {
  timestamps: true
});

adminActivitySchema.index({ createdAt: -1 });
// adminActivitySchema.index({ user: 1, createdAt: -1 }); // Removed duplicate index
adminActivitySchema.index({ resourceType: 1, createdAt: -1 });
adminActivitySchema.index({ severity: 1, createdAt: -1 });

const AdminActivity = mongoose.model('AdminActivity', adminActivitySchema);

export default AdminActivity;
