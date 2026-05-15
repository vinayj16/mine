import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
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
  admissionNumber: {
    type: String,
    required: true,
    unique: true
  },
  rollNumber: {
    type: String
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
    trim: true,
    lowercase: true
  },
  phone: {
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
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
    index: true
  },
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section'
  },
  admissionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  academicYear: {
    type: String,
    required: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent'
  },
  guardianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guardian'
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  medicalInfo: {
    allergies: [String],
    medications: [String],
    conditions: [String],
    doctorName: String,
    doctorPhone: String
  },
  previousSchool: {
    name: String,
    address: String,
    lastClass: String,
    leavingDate: Date
  },
  documents: [{
    type: {
      type: String,
      enum: ['birth_certificate', 'transfer_certificate', 'photo', 'id_proof', 'other']
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
    enum: ['active', 'inactive', 'graduated', 'transferred', 'expelled'],
    default: 'active',
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

studentSchema.index({ institutionId: 1, schoolId: 1, classId: 1, status: 1 });
studentSchema.index({ institutionId: 1, schoolId: 1, admissionNumber: 1 }, { unique: true });
studentSchema.index({ institutionId: 1, status: 1 });

studentSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

studentSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

studentSchema.set('toJSON', { virtuals: true });
studentSchema.set('toObject', { virtuals: true });

const Student = mongoose.model('Student', studentSchema);

export default Student;
