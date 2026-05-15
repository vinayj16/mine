import mongoose from 'mongoose';

const hostelAttendanceSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'leave'],
    default: 'present'
  },
  remarks: {
    type: String,
    trim: true
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

hostelAttendanceSchema.index({ institution: 1, room: 1, date: 1, student: 1 }, { unique: true });

export default mongoose.model('HostelAttendance', hostelAttendanceSchema);
