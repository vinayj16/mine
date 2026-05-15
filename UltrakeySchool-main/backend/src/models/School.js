import mongoose from 'mongoose';

const schoolContactSchema = new mongoose.Schema({
  email: { type: String, required: true },
  phone: { type: String, required: true },
  alternatePhone: String,
  website: String,
  fax: String,
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String, required: true }
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  }
}, { _id: false });

const AdministrationSchema = new mongoose.Schema({
  principalName: { type: String, required: true },
  principalEmail: { type: String, required: true },
  principalPhone: { type: String, required: true },
  vicePrincipalName: String,
  vicePrincipalEmail: String,
  vicePrincipalPhone: String,
  adminContact: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  boardChairman: String,
  boardMembers: [String]
}, { _id: false });

const academicProgramsSchema = new mongoose.Schema({
  curriculum: [{ type: String }],
  grades: [{ type: String }],
  streams: [{ type: String }],
  subjects: [{ type: String }],
  languages: [{ type: String }],
  extracurricular: [{ type: String }],
  specialPrograms: [{ type: String }]
}, { _id: false });

const schoolFacilitiesSchema = new mongoose.Schema({
  classrooms: { type: Number, default: 0 },
  labs: {
    science: { type: Number, default: 0 },
    computer: { type: Number, default: 0 },
    language: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  library: {
    books: { type: Number, default: 0 },
    digitalResources: { type: Boolean, default: false },
    onlineAccess: { type: Boolean, default: false }
  },
  sportsFacilities: [{ type: String }],
  auditoriums: { type: Number, default: 0 },
  cafeterias: { type: Number, default: 0 },
  transport: { type: Boolean, default: false },
  hostel: { type: Boolean, default: false },
  parking: { type: Boolean, default: false }
}, { _id: false });

const schoolPerformanceSchema = new mongoose.Schema({
  academic: {
    averageGrade: { type: Number, default: 0 },
    passPercentage: { type: Number, default: 0 },
    topperGrade: { type: Number, default: 0 },
    improvementRate: { type: Number, default: 0 }
  },
  attendance: {
    studentAttendance: { type: Number, default: 0 },
    teacherAttendance: { type: Number, default: 0 },
    workingDays: { type: Number, default: 180 }
  },
  satisfaction: {
    studentSatisfaction: { type: Number, default: 0 },
    parentSatisfaction: { type: Number, default: 0 },
    teacherSatisfaction: { type: Number, default: 0 }
  }
}, { _id: false });

const schoolFeaturesSchema = new mongoose.Schema({
  maxUsers: { type: Number, required: true },
  maxStudents: { type: Number, required: true },
  storageLimit: { type: Number, required: true },
  apiCallsLimit: Number,
  customDomain: { type: Boolean, default: false },
  whiteLabel: { type: Boolean, default: false },
  advancedAnalytics: { type: Boolean, default: false },
  prioritySupport: { type: Boolean, default: false }
}, { _id: false });

const schoolSubscriptionSchema = new mongoose.Schema({
  planId: { type: String, enum: ['basic', 'medium', 'premium'], required: true },
  planName: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['active', 'expired', 'cancelled', 'suspended', 'trial'], 
    default: 'active' 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  renewalDate: Date,
  autoRenewal: { type: Boolean, default: true },
  billingCycle: { 
    type: String, 
    enum: ['monthly', 'quarterly', 'semi-annual', 'annual'], 
    default: 'monthly' 
  },
  monthlyCost: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  paymentMethod: { 
    type: String, 
    enum: ['card', 'bank', 'check', 'wire'] 
  },
  lastPaymentDate: Date,
  nextPaymentDate: Date,
  features: { type: schoolFeaturesSchema, required: true }
}, { _id: false });

const schoolSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: true,
    trim: true
  },
  shortName: {
    type: String,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  type: {
    type: String,
    enum: ['School', 'Inter College', 'Degree College', 'Engineering College'],
    required: true
  },
  category: {
    type: String,
    enum: ['primary', 'secondary', 'higher-secondary', 'undergraduate', 'postgraduate'],
    required: true
  },
  accreditation: [{
    type: String
  }],
  established: {
    type: Number,
    required: true
  },
  motto: String,
  description: String,

  // Contact & Location
  contact: {
    type: schoolContactSchema,
    required: true
  },

  // Administration
  administration: {
    type: AdministrationSchema,
    required: true
  },

  // Academic Programs
  academicPrograms: {
    type: academicProgramsSchema,
    default: () => ({})
  },

  // Facilities
  facilities: {
    type: schoolFacilitiesSchema,
    default: () => ({})
  },

  // Performance
  performance: {
    type: schoolPerformanceSchema,
    default: () => ({})
  },

  // Subscription
  subscription: {
    type: schoolSubscriptionSchema,
    required: true
  },

  // Demographics
  totalStudents: {
    type: Number,
    default: 0
  },
  totalTeachers: {
    type: Number,
    default: 0
  },
  totalStaff: {
    type: Number,
    default: 0
  },
  studentTeacherRatio: {
    type: Number,
    default: 0
  },
  genderDistribution: {
    maleStudents: { type: Number, default: 0 },
    femaleStudents: { type: Number, default: 0 },
    maleTeachers: { type: Number, default: 0 },
    femaleTeachers: { type: Number, default: 0 }
  },

  // Operational
  academicYear: {
    type: String,
    required: true
  },
  workingDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  workingHours: {
    start: { type: String, required: true },
    end: { type: String, required: true }
  },
  holidays: [{
    type: String
  }],
  timezone: {
    type: String,
    default: 'UTC'
  },

  // Financial
  annualBudget: {
    type: Number,
    default: 0
  },
  monthlyRevenue: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  outstandingPayments: {
    type: Number,
    default: 0
  },

  // Legacy fields for backward compatibility
  adminName: String,
  adminEmail: String,
  adminPhone: String,
  address: String,
  city: String,
  state: String,
  country: String,
  postalCode: String,
  plan: {
    type: String,
    enum: ['Basic', 'Medium', 'Premium', 'basic', 'medium', 'premium'],
    default: 'Basic'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'trial', 'expired', 'Active', 'Suspended', 'Expired', 'cancelled'],
    default: 'active'
  },
  expiryDate: String,
  students: {
    type: Number,
    default: 0
  },
  monthlyRevenueLegacy: Number,
  totalRevenueLegacy: Number,
  createdAtLegacy: String,
  lastLogin: String,

  // System
  tags: [{
    type: String
  }],
  notes: String,
  
  // Institution reference
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution'
  }
}, {
  timestamps: true
});

// Indexes
schoolSchema.index({ name: 'text' });
schoolSchema.index({ type: 1 });
schoolSchema.index({ category: 1 });
schoolSchema.index({ status: 1 });
schoolSchema.index({ 'subscription.status': 1 });
schoolSchema.index({ 'subscription.endDate': 1 });
schoolSchema.index({ city: 1 });
schoolSchema.index({ state: 1 });

// Virtual for checking if subscription is expiring
schoolSchema.virtual('isSubscriptionExpiring').get(function() {
  if (!this.subscription || !this.subscription.endDate) return false;
  const daysUntilExpiry = Math.ceil((this.subscription.endDate - new Date()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
});

// Method to check if expired
schoolSchema.methods.isExpired = function() {
  return this.subscription && this.subscription.endDate < new Date();
};

// Method to check if subscription is active
schoolSchema.methods.isSubscriptionActive = function() {
  return this.subscription && 
    ['active', 'trial'].includes(this.subscription.status) && 
    this.subscription.endDate > new Date();
};

// Pre-save middleware
schoolSchema.pre('save', function(next) {
  // Calculate student-teacher ratio
  if (this.totalStudents && this.totalTeachers) {
    this.studentTeacherRatio = this.totalStudents / this.totalTeachers;
  }
  
  // Sync legacy fields
  if (this.contact) {
    this.adminEmail = this.contact.email;
    this.adminPhone = this.contact.phone;
    this.address = this.contact.address?.street;
    this.city = this.contact.address?.city;
    this.state = this.contact.address?.state;
    this.country = this.contact.address?.country;
    this.postalCode = this.contact.address?.postalCode;
  }
  
  if (this.administration) {
    this.adminName = this.administration.adminContact?.name;
  }
  
  if (this.subscription) {
    this.plan = this.subscription.planName;
    this.expiryDate = this.subscription.endDate?.toISOString().split('T')[0];
    this.students = this.totalStudents;
    this.monthlyRevenueLegacy = this.subscription.monthlyCost;
  }
  
  next();
});

schoolSchema.set('toJSON', { virtuals: true });
schoolSchema.set('toObject', { virtuals: true });

export default mongoose.model('School', schoolSchema);
