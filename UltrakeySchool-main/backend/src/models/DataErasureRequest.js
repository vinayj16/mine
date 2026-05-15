import mongoose from 'mongoose';

const dataErasureRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  requestType: {
    type: String,
    enum: ['partial', 'full'],
    default: 'full'
  },
  requestedData: {
    type: [String],
    enum: ['personal', 'academic', 'financial', 'attendance', 'communication'],
    default: ['personal']
  },
  reason: {
    type: String,
    required: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'approved', 'rejected', 'completed', 'failed'],
    default: 'pending'
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  rejectedReason: {
    type: String,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  gracePeriodEndsAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  },
  verificationToken: {
    type: String,
    required: true
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  dataBackup: {
    type: String, // URL to backup file before deletion
    default: null
  }
}, {
  timestamps: true
});

// Indexes for performance
// dataErasureRequestSchema.index({ userId: 1, createdAt: -1 }); // Removed duplicate index
dataErasureRequestSchema.index({ status: 1, createdAt: -1 });
dataErasureRequestSchema.index({ institutionId: 1, status: 1 });
dataErasureRequestSchema.index({ gracePeriodEndsAt: 1 });

export default mongoose.model('DataErasureRequest', dataErasureRequestSchema);