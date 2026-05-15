import mongoose from 'mongoose';

const teacherLeaveSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
    index: true
  },
  leaveType: {
    type: String,
    enum: ['sick', 'casual', 'earned', 'maternity', 'paternity', 'unpaid', 'emergency', 'other'],
    required: true
  },
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalDays: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
    index: true
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedDate: {
    type: Date
  },
  reviewComments: {
    type: String,
    trim: true
  },
  attachments: [{
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

teacherLeaveSchema.index({ schoolId: 1, teacherId: 1, startDate: -1 });
teacherLeaveSchema.index({ schoolId: 1, status: 1 });

const TeacherLeave = mongoose.model('TeacherLeave', teacherLeaveSchema);

export default TeacherLeave;
