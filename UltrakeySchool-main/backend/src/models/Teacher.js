import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
    index: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  employeeId: {
    type: String,
    required: true
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
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  alternatePhone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  qualification: {
    degree: String,
    specialization: String,
    university: String,
    year: Number
  },
  experience: {
    totalYears: Number,
    previousSchools: [{
      name: String,
      position: String,
      from: Date,
      to: Date
    }]
  },
  joiningDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  designation: {
    type: String,
    required: true
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  classes: [{
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section'
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    isClassTeacher: {
      type: Boolean,
      default: false
    }
  }],
  salary: {
    basic: Number,
    allowances: Number,
    deductions: Number,
    total: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    paymentMode: {
      type: String,
      enum: ['bank_transfer', 'cash', 'cheque'],
      default: 'bank_transfer'
    }
  },
  bankDetails: {
    accountNumber: String,
    bankName: String,
    branchName: String,
    ifscCode: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  documents: [{
    type: {
      type: String,
      enum: ['resume', 'degree', 'certificate', 'id_proof', 'photo', 'other']
    },
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'on_leave', 'resigned', 'terminated'],
    default: 'active'
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

teacherSchema.index({ institutionId: 1, schoolId: 1, employeeId: 1 }, { unique: true });
teacherSchema.index({ institutionId: 1, schoolId: 1, status: 1 });
teacherSchema.index({ institutionId: 1, status: 1 });

teacherSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

teacherSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

teacherSchema.set('toJSON', { virtuals: true });
teacherSchema.set('toObject', { virtuals: true });

const Teacher = mongoose.model('Teacher', teacherSchema);

export default Teacher;
