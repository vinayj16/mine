import mongoose from 'mongoose';

const reportTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  reportType: {
    type: String,
    enum: ['attendance', 'fees', 'student_summary', 'custom'],
    required: true
  },
  format: {
    type: String,
    enum: ['pdf', 'excel', 'csv', 'json'],
    default: 'pdf'
  },
  parameters: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
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
  isDefault: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

reportTemplateSchema.index({ institution: 1, reportType: 1, name: 1 });

const ReportTemplate = mongoose.model('ReportTemplate', reportTemplateSchema);
export default ReportTemplate;
