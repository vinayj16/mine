import mongoose from 'mongoose';

const userCredentialSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
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
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['superadmin', 'institution_admin', 'admin', 'principal', 'teacher', 'student', 'parent', 'accountant', 'librarian', 'hr_manager', 'transport_manager', 'hostel_warden', 'staff_member', 'agent']
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution'
  },
  institutionId: {
    type: String,
    default: null
  },
  permissions: [{
    type: String,
    enum: ['read', 'write', 'manage_students', 'manage_staff', 'manage_finances', 'manage_library']
  }],
  instituteType: {
    type: String,
    required: true
  },
  instituteCode: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  hasLoggedIn: {
    type: Boolean,
    default: false
  },
  lastLoginAt: {
    type: Date
  },
  emailVerified: {
    type: Boolean,
    default: false
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

// Update the updatedAt field before saving
userCredentialSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for faster queries
userCredentialSchema.index({ role: 1 });
userCredentialSchema.index({ status: 1 });

const UserCredential = mongoose.model('UserCredential', userCredentialSchema);

export default UserCredential;
