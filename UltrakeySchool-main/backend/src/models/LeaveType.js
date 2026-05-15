import mongoose from 'mongoose';

const leaveTypeSchema = new mongoose.Schema({
  leaveTypeId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  maxDays: {
    type: Number,
    min: 0
  },
  isPaid: {
    type: Boolean,
    default: true
  },
  requiresApproval: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
leaveTypeSchema.index({ institution: 1, type: 1 });
leaveTypeSchema.index({ status: 1 });

export default mongoose.model('LeaveType', leaveTypeSchema);
