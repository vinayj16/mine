import mongoose from 'mongoose';

const scheduledReportSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReportTemplate',
    required: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  schedule: {
    cron: { type: String, required: true },
    timezone: { type: String, default: 'UTC' }
  },
  recipients: [{ type: String }],
  status: {
    type: String,
    enum: ['active', 'paused', 'failed'],
    default: 'active'
  },
  lastRunAt: { type: Date },
  lastRunResult: { type: String, default: 'pending' },
  nextRunAt: { type: Date },
  params: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

scheduledReportSchema.index({ institution: 1 });
scheduledReportSchema.index({ status: 1 });

const ScheduledReport = mongoose.model('ScheduledReport', scheduledReportSchema);
export default ScheduledReport;
