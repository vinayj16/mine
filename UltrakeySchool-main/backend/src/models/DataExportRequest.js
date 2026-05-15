import mongoose from 'mongoose';

const dataExportRequestSchema = new mongoose.Schema({
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
    enum: ['full', 'partial', 'specific'],
    default: 'full'
  },
  requestedData: {
    type: [String],
    enum: ['personal', 'academic', 'financial', 'attendance', 'communication', 'all'],
    default: ['all']
  },
  format: {
    type: String,
    enum: ['json', 'csv', 'pdf', 'xlsx'],
    default: 'json'
  },
  filters: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  fileUrl: {
    type: String,
    default: null
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  },
  processedAt: {
    type: Date,
    default: null
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reason: {
    type: String,
    default: null
  },
  exports: {
    datasets: {
      type: [String],
      default: []
    },
    fileKey: {
      type: String,
      default: null
    }
  },
  verificationToken: {
    type: String,
    required: true
  },
  verifiedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for performance
// dataExportRequestSchema.index({ userId: 1, createdAt: -1 }); // Removed duplicate index
dataExportRequestSchema.index({ status: 1, createdAt: -1 });
dataExportRequestSchema.index({ institutionId: 1, status: 1 });
dataExportRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('DataExportRequest', dataExportRequestSchema);
