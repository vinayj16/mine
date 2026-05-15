import mongoose from 'mongoose';

const guardianRelationshipSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['father', 'mother', 'guardian', 'grandparent', 'sibling', 'other'],
    required: true
  },
  priority: {
    type: Number,
    enum: [1, 2, 3],
    default: 1
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  isEmergency: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const childRelationshipSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  relationship: guardianRelationshipSchema,
  enrollmentDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const guardianSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  guardianId: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
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
  phone: {
    type: String,
    required: true
  },
  alternatePhone: {
    type: String
  },
  avatar: {
    type: String
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  occupation: {
    type: String
  },
  education: {
    type: String
  },
  maritalStatus: {
    type: String,
    enum: ['single', 'married', 'divorced', 'widowed']
  },
  nationality: {
    type: String
  },
  language: [{
    type: String
  }],
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  permissions: {
    canViewGrades: {
      type: Boolean,
      default: true
    },
    canViewAttendance: {
      type: Boolean,
      default: true
    },
    canViewFees: {
      type: Boolean,
      default: true
    },
    canReceiveNotifications: {
      type: Boolean,
      default: true
    },
    canCommunicateWithTeachers: {
      type: Boolean,
      default: true
    },
    canApproveLeaves: {
      type: Boolean,
      default: false
    },
    canAccessReports: {
      type: Boolean,
      default: true
    }
  },
  children: [childRelationshipSchema],
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  notes: {
    type: String
  },
  tags: [{
    type: String
  }],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

guardianSchema.index({ schoolId: 1, guardianId: 1 });
guardianSchema.index({ 'children.studentId': 1 });
guardianSchema.index({ status: 1 });

guardianSchema.virtual('name').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

guardianSchema.methods.getPrimaryChildren = function() {
  return this.children.filter(child => child.relationship.isPrimary && child.isActive);
};

guardianSchema.methods.getEmergencyChildren = function() {
  return this.children.filter(child => child.relationship.isEmergency && child.isActive);
};

guardianSchema.set('toJSON', { virtuals: true });
guardianSchema.set('toObject', { virtuals: true });

export default mongoose.model('Guardian', guardianSchema);
