import mongoose from 'mongoose';

const transportReportSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  reportType: {
    type: String,
    enum: ['Route', 'Vehicle', 'Driver', 'Student', 'Revenue'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  period: {
    type: String,
    required: true
  },
  generatedDate: {
    type: Date,
    default: Date.now
  },
  totalRecords: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['completed', 'processing', 'scheduled'],
    default: 'processing'
  },
  reportData: {
    type: mongoose.Schema.Types.Mixed
  },
  fileUrl: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

transportReportSchema.index({ institutionId: 1, reportType: 1, generatedDate: -1 });

export default mongoose.model('TransportReport', transportReportSchema);
