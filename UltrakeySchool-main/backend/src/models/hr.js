import mongoose from 'mongoose';

// Employee Schema (extends User for HR data)
const employeeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: String,
    enum: ['administration', 'teaching', 'support', 'maintenance', 'transport', 'security', 'other'],
    required: true
  },
  designation: {
    type: String,
    required: true,
    trim: true
  },
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'temporary'],
    default: 'full-time'
  },
  joiningDate: {
    type: Date,
    required: true
  },
  salary: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'terminated', 'on-leave'],
    default: 'active'
  },
  reportingTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    address: String
  },
  qualifications: [{
    degree: String,
    institution: String,
    year: Number,
    grade: String
  }],
  experience: [{
    company: String,
    position: String,
    startDate: Date,
    endDate: Date,
    description: String
  }],
  documents: [{
    type: {
      type: String,
      enum: ['id-proof', 'address-proof', 'qualification', 'experience', 'photo', 'other']
    },
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  performance: {
    currentRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    lastReviewDate: Date,
    nextReviewDate: Date
  }
}, {
  timestamps: true
});

// Indexes
employeeSchema.index({ institution: 1, department: 1 });
// employeeSchema.index({ employeeId: 1 }); // Removed duplicate index
// employeeSchema.index({ user: 1 }); // Removed duplicate index
employeeSchema.index({ status: 1 });

const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);

// Leave Schema
const leaveSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  leaveType: {
    type: String,
    enum: ['annual', 'sick', 'maternity', 'paternity', 'emergency', 'other'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalDays: {
    type: Number,
    required: true,
    min: 0.5
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedDate: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  documents: [{
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
leaveSchema.index({ employee: 1, status: 1 });
leaveSchema.index({ institution: 1, status: 1 });
leaveSchema.index({ startDate: 1, endDate: 1 });
leaveSchema.index({ approvedBy: 1 });

const Leave = mongoose.models.Leave || mongoose.model('Leave', leaveSchema);

// Recruitment Schema
const recruitmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    enum: ['administration', 'teaching', 'support', 'maintenance', 'transport', 'security', 'other'],
    required: true
  },
  designation: {
    type: String,
    required: true,
    trim: true
  },
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'temporary'],
    default: 'full-time'
  },
  salary: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  requirements: [String],
  responsibilities: [String],
  benefits: [String],
  location: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'closed', 'cancelled'],
    default: 'draft'
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  publishedDate: Date,
  closingDate: Date,
  applicants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    appliedDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['applied', 'shortlisted', 'interviewed', 'selected', 'rejected'],
      default: 'applied'
    },
    resume: String,
    coverLetter: String,
    notes: String
  }]
}, {
  timestamps: true
});

// Indexes
recruitmentSchema.index({ institution: 1, status: 1 });
recruitmentSchema.index({ department: 1 });
recruitmentSchema.index({ postedBy: 1 });

const Recruitment = mongoose.models.Recruitment || mongoose.model('Recruitment', recruitmentSchema);

// Performance Review Schema
const performanceReviewSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  reviewPeriod: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewType: {
    type: String,
    enum: ['annual', 'mid-year', 'probation', 'project', 'other'],
    default: 'annual'
  },
  ratings: {
    overall: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    technicalSkills: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    teamwork: {
      type: Number,
      min: 1,
      max: 5
    },
    punctuality: {
      type: Number,
      min: 1,
      max: 5
    },
    leadership: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  strengths: [String],
  areasForImprovement: [String],
  goals: [{
    description: String,
    targetDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending'
    }
  }],
  comments: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'reviewed', 'acknowledged'],
    default: 'draft'
  },
  submittedDate: Date,
  reviewedDate: Date,
  acknowledgedDate: Date
}, {
  timestamps: true
});

// Indexes
performanceReviewSchema.index({ employee: 1, reviewPeriod: 1 }, { unique: true });
performanceReviewSchema.index({ institution: 1, status: 1 });
performanceReviewSchema.index({ reviewer: 1 });

const PerformanceReview = mongoose.models.PerformanceReview || mongoose.model('PerformanceReview', performanceReviewSchema);

// Training Schema
const trainingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['internal', 'external', 'online', 'workshop', 'seminar'],
    required: true
  },
  category: {
    type: String,
    enum: ['technical', 'soft-skills', 'compliance', 'leadership', 'safety', 'other'],
    required: true
  },
  instructor: {
    name: String,
    credentials: String,
    organization: String
  },
  schedule: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    duration: Number, // in hours
    location: String,
    onlineLink: String
  },
  capacity: {
    type: Number,
    min: 1
  },
  enrolled: [{
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    enrolledDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['enrolled', 'completed', 'dropped', 'failed'],
      default: 'enrolled'
    },
    completionDate: Date,
    grade: String,
    feedback: String
  }],
  prerequisites: [String],
  objectives: [String],
  materials: [{
    name: String,
    url: String,
    type: String
  }],
  status: {
    type: String,
    enum: ['planned', 'active', 'completed', 'cancelled'],
    default: 'planned'
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  budget: {
    type: Number,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes
trainingSchema.index({ institution: 1, status: 1 });
trainingSchema.index({ 'schedule.startDate': 1, 'schedule.endDate': 1 });
trainingSchema.index({ createdBy: 1 });

const Training = mongoose.models.Training || mongoose.model('Training', trainingSchema);

export {
  Employee,
  Leave,
  Recruitment,
  PerformanceReview,
  Training
};

export default {
  Employee,
  Leave,
  Recruitment,
  PerformanceReview,
  Training
};
