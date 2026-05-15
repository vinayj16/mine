import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  institutionName: {
    type: String,
    required: true
  },
  institutionType: {
    type: String,
    required: true
  },
  address: {
    street: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, default: 'India' },
    postalCode: String
  },
  contact: {
    email: String,
    phone: String,
    alternatePhone: String
  },
  branchHead: {
    name: String,
    email: String,
    phone: String
  },
  students: {
    type: Number,
    default: 0
  },
  teachers: {
    type: Number,
    default: 0
  },
  staff: {
    type: Number,
    default: 0
  },
  capacity: {
    maxStudents: Number,
    maxTeachers: Number,
    maxStaff: Number
  },
  facilities: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['Active', 'Suspended', 'Inactive'],
    default: 'Active'
  },
  establishedDate: Date,
  lastActivity: {
    type: Date,
    default: Date.now
  },
  notes: String,
  tags: [{
    type: String
  }]
}, {
  timestamps: true
});

// Indexes
branchSchema.index({ institutionId: 1 });
branchSchema.index({ status: 1 });
branchSchema.index({ name: 'text' });

// Update lastActivity on save
branchSchema.pre('save', function(next) {
  this.lastActivity = new Date();
  next();
});

export default mongoose.model('Branch', branchSchema);
