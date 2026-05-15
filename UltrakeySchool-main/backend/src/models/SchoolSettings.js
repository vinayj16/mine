import mongoose from 'mongoose';

const schoolSettingsSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
    unique: true
  },
  
  basicInfo: {
    schoolName: {
      type: String,
      required: true,
      trim: true
    },
    phoneNumber: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    fax: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    }
  },
  
  academicSettings: {
    academicYear: {
      type: String,
      default: '2024/2025'
    },
    sessionStartDate: Date,
    sessionEndDate: Date,
    weekendDays: [{
      type: String,
      enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    }],
    workingDays: [{
      type: String,
      enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    }],
    classStartTime: String,
    classEndTime: String,
    periodDuration: {
      type: Number,
      default: 45
    },
    breakDuration: {
      type: Number,
      default: 15
    }
  },
  
  examSettings: {
    passingPercentage: {
      type: Number,
      default: 40,
      min: 0,
      max: 100
    },
    gradingSystem: {
      type: String,
      enum: ['percentage', 'gpa', 'cgpa', 'letter'],
      default: 'percentage'
    },
    maxMarks: {
      type: Number,
      default: 100
    }
  },
  
  attendanceSettings: {
    minimumAttendance: {
      type: Number,
      default: 75,
      min: 0,
      max: 100
    },
    lateArrivalTime: {
      type: Number,
      default: 15
    },
    halfDayThreshold: {
      type: Number,
      default: 4
    }
  },
  
  feeSettings: {
    currency: {
      type: String,
      default: 'USD'
    },
    lateFeePercentage: {
      type: Number,
      default: 5
    },
    lateFeeGracePeriod: {
      type: Number,
      default: 7
    }
  },
  
  notificationSettings: {
    enableEmailNotifications: {
      type: Boolean,
      default: true
    },
    enableSMSNotifications: {
      type: Boolean,
      default: false
    },
    enablePushNotifications: {
      type: Boolean,
      default: true
    }
  },
  
  logo: {
    url: String,
    publicId: String
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

schoolSettingsSchema.index({ 'basicInfo.schoolName': 1 });
schoolSettingsSchema.index({ 'academicSettings.academicYear': 1 });

const SchoolSettings = mongoose.model('SchoolSettings', schoolSettingsSchema);

export default SchoolSettings;
