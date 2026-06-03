import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  userName: { type: String, default: '' },
  userRole: { type: String, default: '' },
  action: { type: String, required: true, index: true },
  category: {
    type: String,
    enum: ['plan-change', 'suspension', 'password-reset', 'login', 'impersonation', 'module-change', 'settings-change', 'other'],
    default: 'other',
    index: true
  },
  resource: { type: String, default: '' },
  resourceId: { type: String, default: '' },
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  status: {
    type: String,
    enum: ['success', 'failure', 'warning'],
    default: 'success',
    index: true
  },
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', index: true },
  institutionName: { type: String, default: '' }
}, {
  timestamps: true,
  collection: 'auditlogs'
});

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ category: 1, createdAt: -1 });
auditLogSchema.index({ status: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
