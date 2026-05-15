import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'User',
    default: null
  },
  userName: {
    type: String,
    default: ''
  },
  userEmail: {
    type: String,
    default: ''
  },
  userRole: {
    type: String,
    default: ''
  },
  action: {
    type: String,
    required: true
  },
  actionType: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  entityType: {
    type: String,
    default: ''
  },
  entityId: {
    type: mongoose.Schema.Types.Mixed
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: 'N/A'
  },
  userAgent: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'warning'],
    default: 'success'
  },
  institutionCode: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for performance and compliance
auditLogSchema.index({ institutionId: 1, createdAt: -1 });
// auditLogSchema.index({ userId: 1, createdAt: -1 }); // Removed duplicate index
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 }); // 1 year retention

export default mongoose.model('AuditLog', auditLogSchema, 'auditlogs');
