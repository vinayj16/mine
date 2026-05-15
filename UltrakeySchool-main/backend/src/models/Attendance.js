import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
    index: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  userType: {
    type: String,
    enum: ['student', 'teacher', 'staff'],
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'emergency'],
    required: true
  },
  checkInTime: {
    type: Date
  },
  checkOutTime: {
    type: Date
  },
  remarks: {
    type: String,
    maxlength: 500
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  method: {
    type: String,
    enum: ['manual'],
    default: 'manual'
  },
  biometricData: {
    deviceId: String,
    fingerprintId: String,
    timestamp: Date,
    verified: {
      type: Boolean,
      default: false
    }
  },
  faceRecognitionData: {
    imageUrl: String,
    confidence: Number, // 0-100
    timestamp: Date,
    verified: {
      type: Boolean,
      default: false
    }
  },
  qrCodeData: {
    qrCode: String,
    scannedAt: Date,
    location: {
      latitude: Number,
      longitude: Number
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  deviceInfo: {
    type: String,
    userAgent: String,
    ipAddress: String
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
attendanceSchema.index({ institutionId: 1, schoolId: 1, userType: 1, date: -1 });
attendanceSchema.index({ institutionId: 1, schoolId: 1, userId: 1, date: -1 });
attendanceSchema.index({ institutionId: 1, date: -1 });

export default mongoose.model('Attendance', attendanceSchema);
