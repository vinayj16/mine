import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
  leaveId: { type: String, required: true, unique: true },
  staffId: { type: String, required: true },
  staffName: { type: String, required: true },
  leaveType: {
    type: String,
    enum: ['casual', 'sick', 'maternity', 'paternity', 'annual', 'emergency'],
    required: true
  },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  days: { type: Number, required: true },
  reason: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  appliedOn: { type: Date, default: Date.now },
  approvedBy: String,
  approvedOn: Date,
  comments: String,
  documents: [String]
}, {
  timestamps: true
});

leaveSchema.index({ staffId: 1 });
leaveSchema.index({ status: 1 });
leaveSchema.index({ leaveType: 1 });
leaveSchema.index({ startDate: 1 });

export default mongoose.model('Leave', leaveSchema);
