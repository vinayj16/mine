import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  studentCode: {
    type: String,
    required: false
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  className: {
    type: String,
    required: false
  },
  section: {
    type: String,
    default: 'A'
  },
  academicYear: {
    type: String,
    required: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  rollNumber: {
    type: String,
    default: ''
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'transferred', 'dropped'],
    default: 'active'
  },
  promotionStatus: {
    type: String,
    enum: ['pending', 'promoted', 'detained', 'graduated'],
    default: 'pending'
  },
  previousEnrollmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    default: null
  },
  remarks: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
enrollmentSchema.index({ studentId: 1, academicYear: 1 }, { unique: true });
enrollmentSchema.index({ classId: 1, academicYear: 1 });
enrollmentSchema.index({ schoolId: 1, academicYear: 1 });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

export default Enrollment;
