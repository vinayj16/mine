import mongoose from 'mongoose';

const studentTransportSchema = new mongoose.Schema({
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
  transportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transport',
    required: true,
    index: true
  },
  routeName: {
    type: String,
    required: true
  },
  vehicleNumber: {
    type: String,
    required: true
  },
  pickupPoint: {
    type: String,
    required: true
  },
  pickupTime: {
    type: String
  },
  dropPoint: {
    type: String
  },
  dropTime: {
    type: String
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
    index: true
  },
  feesPaid: {
    type: Boolean,
    default: false
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

studentTransportSchema.index({ schoolId: 1, studentId: 1 });
studentTransportSchema.index({ transportId: 1, status: 1 });

const StudentTransport = mongoose.models.StudentTransport || mongoose.model('StudentTransport', studentTransportSchema);

export default StudentTransport;
