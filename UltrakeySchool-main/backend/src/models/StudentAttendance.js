import mongoose from 'mongoose';

const studentAttendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  admissionNo: {
    type: String,
    required: true
  },
  rollNo: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  className: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  attendance: {
    type: String,
    enum: ['present', 'late', 'absent', 'holiday', 'halfday'],
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  markedByName: {
    type: String,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  period: {
    type: String
  },
  subject: {
    type: String
  },
  isModified: {
    type: Boolean,
    default: false
  },
  modificationHistory: [{
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    modifiedByName: String,
    previousAttendance: String,
    newAttendance: String,
    modifiedAt: Date,
    reason: String
  }]
}, {
  timestamps: true,
  suppressReservedKeysWarning: true // Suppress warning for 'isModified' field
});

// Indexes
studentAttendanceSchema.index({ studentId: 1, date: 1 });
studentAttendanceSchema.index({ institutionId: 1, date: 1 });
studentAttendanceSchema.index({ className: 1, section: 1, date: 1 });
studentAttendanceSchema.index({ academicYear: 1, institutionId: 1 });
studentAttendanceSchema.index({ date: -1 });
studentAttendanceSchema.index({ attendance: 1 });

// Compound unique index to prevent duplicate attendance records
studentAttendanceSchema.index(
  { studentId: 1, date: 1, period: 1 },
  { unique: true, sparse: true }
);

const StudentAttendance = mongoose.model('StudentAttendance', studentAttendanceSchema);

export default StudentAttendance;
