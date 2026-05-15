import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: false,
    minlength: 0
  },
  role: {
    type: String,
    enum: [
      'superadmin',        // Platform-wide administrator
      'institution_admin', // Institution owner/primary admin
      'admin',             // Institution administration (same level as institution_admin for flexibility)
      'principal',         // School principal
      'teacher',           // Teaching staff
      'student',           // Students
      'parent',            // Parents/guardians
      'accountant',        // Financial management
      'hr_manager',        // Human resources
      'librarian',         // Library management
      'transport_manager', // Transport operations
      'hostel_warden',     // Hostel management
      'staff_member',      // General staff
      'agent'              // Agent for admissions
    ],
    default: 'student'
  },
  plan: {
    type: String,
    enum: ['basic', 'medium', 'premium'],
    default: 'basic'
  },
  permissions: [{
    type: String
  }],
  modules: [{
    type: String
  }],
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution'
  },
  institution: {
    type: String,
    default: null
  },
  institutionCode: {
    type: String,
    default: null
  },
  schoolId: {
    type: String
  },
  avatar: {
    type: String
  },
  phone: {
    type: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  // Teacher specific fields
  department: {
    type: String,
    default: ''
  },
  designation: {
    type: String,
    default: ''
  },
  qualification: {
    type: String,
    default: ''
  },
  experience: {
    type: String,
    default: ''
  },
  joiningDate: {
    type: Date,
    default: null
  },
  salary: {
    type: Number,
    default: 0
  },
  employeeId: {
    type: String,
    default: ''
  },
  // Student specific fields
  class: {
    type: String,
    default: ''
  },
  section: {
    type: String,
    default: ''
  },
  rollNumber: {
    type: String,
    default: ''
  },
  admissionNumber: {
    type: String,
    default: ''
  },
  bloodGroup: {
    type: String,
    default: ''
  },
  religion: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: ''
  },
  fatherName: {
    type: String,
    default: ''
  },
  motherName: {
    type: String,
    default: ''
  },
  guardianName: {
    type: String,
    default: ''
  },
  guardianPhone: {
    type: String,
    default: ''
  },
  guardianEmail: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  lastLogin: {
    type: Date
  },
  // Chat presence tracking
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  socketId: {
    type: String,
    default: null
  },
  refreshToken: {
    type: String
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    colorScheme: {
      type: String,
      enum: ['blue', 'green', 'purple', 'orange', 'red'],
      default: 'blue'
    },
    fontSize: {
      type: String,
      enum: ['small', 'medium', 'large', 'xlarge'],
      default: 'medium'
    },
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    accessibility: {
      highContrast: {
        type: Boolean,
        default: false
      },
      reducedMotion: {
        type: Boolean,
        default: false
      },
      screenReader: {
        type: Boolean,
        default: false
      }
    }
  },
  settings: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  deviceTokens: [{
    token: String,
    platform: {
      type: String,
      enum: ['ios', 'android', 'web']
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  biometricData: {
    fingerprintHash: String,
    deviceId: String,
    registeredAt: Date,
    isActive: {
      type: Boolean,
      default: false
    }
  },
  faceRecognitionData: {
    encoding: [Number], // Face encoding vector
    imageUrl: String,
    registeredAt: Date,
    isActive: {
      type: Boolean,
      default: false
    }
  },
  personalQRCode: {
    data: String,
    imageUrl: String,
    generatedAt: Date
  }
}, {
  timestamps: true
});

userSchema.index({ institutionId: 1, role: 1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
