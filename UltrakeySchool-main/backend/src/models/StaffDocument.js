import mongoose from 'mongoose';

const staffDocumentSchema = new mongoose.Schema({
  documentId: {
    type: String,
    required: true,
    unique: true
  },
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documentType: {
    type: String,
    enum: ['contract', 'certificate', 'id-proof', 'medical', 'resume', 'other'],
    required: true
  },
  documentName: {
    type: String,
    required: true,
    trim: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'pending'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
staffDocumentSchema.index({ institution: 1, staff: 1 });
staffDocumentSchema.index({ status: 1 });
staffDocumentSchema.index({ documentType: 1 });
staffDocumentSchema.index({ expiryDate: 1 });

export default mongoose.model('StaffDocument', staffDocumentSchema);
