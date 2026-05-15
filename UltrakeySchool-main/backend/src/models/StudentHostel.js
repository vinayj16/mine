import mongoose from 'mongoose';

const studentHostelSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    unique: true
  },
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true,
    index: true
  },
  hostelName: {
    type: String,
    required: true
  },
  roomNumber: {
    type: String,
    required: true
  },
  bedNumber: {
    type: String
  },
  admissionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  vacatingDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'vacated', 'suspended'],
    default: 'active',
    index: true
  },
  feesPaid: {
    type: Boolean,
    default: false
  },
  securityDeposit: {
    amount: Number,
    paid: Boolean,
    paidDate: Date
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  remarks: {
    type: String
  }
}, {
  timestamps: true
});

studentHostelSchema.index({ schoolId: 1, studentId: 1 });
studentHostelSchema.index({ hostelId: 1, status: 1 });

const StudentHostel = mongoose.model('StudentHostel', studentHostelSchema);

export default StudentHostel;
