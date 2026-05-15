import mongoose from 'mongoose';

const staffContactSchema = new mongoose.Schema({
  email: { type: String, required: true },
  phone: { type: String, required: true },
  alternatePhone: String,
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
  }
}, { _id: false });

const staffQualificationSchema = new mongoose.Schema({
  degree: { type: String, required: true },
  institution: { type: String, required: true },
  yearOfCompletion: { type: Number, required: true },
  grade: String,
  specialization: String,
  certificates: [String]
}, { _id: false });

const staffExperienceSchema = new mongoose.Schema({
  organization: { type: String, required: true },
  position: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: String,
  isCurrent: { type: Boolean, default: false },
  responsibilities: [String],
  achievements: [String]
}, { _id: false });

const staffSalarySchema = new mongoose.Schema({
  basic: { type: Number, required: true },
  hra: { type: Number, default: 0 },
  conveyance: { type: Number, default: 0 },
  lta: { type: Number, default: 0 },
  medical: { type: Number, default: 0 },
  otherAllowances: { type: Number, default: 0 },
  totalEarnings: { type: Number, required: true },
  providentFund: { type: Number, default: 0 },
  professionalTax: { type: Number, default: 0 },
  incomeTax: { type: Number, default: 0 },
  otherDeductions: { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },
  netSalary: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  effectiveFrom: { type: String, required: true }
}, { _id: false });

const staffAttendanceSchema = new mongoose.Schema({
  date: { type: String, required: true },
  checkIn: String,
  checkOut: String,
  hoursWorked: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'late', 'leave'],
    required: true
  },
  remarks: String
}, { _id: false });

const staffSchema = new mongoose.Schema({
  staffId: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  alternatePhone: String,
  avatar: String,
  dateOfBirth: { type: String, required: true },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  maritalStatus: {
    type: String,
    enum: ['single', 'married', 'divorced', 'widowed']
  },
  bloodGroup: String,
  nationality: { type: String, required: true },
  religion: String,

  department: { type: String, required: true },
  departmentName: { type: String, required: true },
  designation: { type: String, required: true },
  designationName: { type: String, required: true },
  employeeType: {
    type: String,
    enum: ['permanent', 'contract', 'part-time', 'intern'],
    required: true
  },
  employmentStatus: {
    type: String,
    enum: ['active', 'inactive', 'terminated', 'resigned'],
    default: 'active'
  },
  joiningDate: { type: String, required: true },
  confirmationDate: String,
  resignationDate: String,
  lastWorkingDate: String,

  contact: { type: staffContactSchema, required: true },
  qualifications: [staffQualificationSchema],
  experience: [staffExperienceSchema],

  salary: { type: staffSalarySchema, required: true },
  bankDetails: {
    accountNumber: String,
    bankName: String,
    ifscCode: String,
    branch: String
  },

  attendance: [staffAttendanceSchema],
  performanceRating: { type: Number, min: 1, max: 5 },
  lastPromotion: String,
  nextPromotionDue: String,

  createdBy: { type: String, required: true },
  updatedBy: { type: String, required: true },
  notes: String,
  tags: [String]
}, {
  timestamps: true
});

staffSchema.index({ department: 1 });
staffSchema.index({ designation: 1 });
staffSchema.index({ employmentStatus: 1 });

export default mongoose.model('Staff', staffSchema);
