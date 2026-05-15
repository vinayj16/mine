import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const agentSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => uuidv4(),
    required: true
  },
  name: {
    type: String,
    required: [true, 'Agent name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[+\d][\d\s\-()]{7,14}$/, 'Please enter a valid phone number']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [100, 'City cannot exceed 100 characters']
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: [100, 'State cannot exceed 100 characters']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    maxlength: [100, 'Country cannot exceed 100 characters']
  },
  postalCode: {
    type: String,
    required: [true, 'Postal code is required'],
    trim: true,
    match: [/^\d{5,10}$/, 'Postal code must be 5-10 digits']
  },
  commissionRate: {
    type: Number,
    required: [true, 'Commission rate is required'],
    min: [0, 'Commission rate cannot be negative'],
    max: [50, 'Commission rate cannot exceed 50%'],
    default: 10
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['Active', 'Suspended', 'Inactive'],
      message: 'Status must be either Active, Suspended, or Inactive'
    },
    default: 'Active'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  tenantId: {
    type: String,
    required: true,
    ref: 'Tenant'
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    default: null
  },
  isGlobal: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: String,
    required: true,
    ref: 'User'
  },
  updatedBy: {
    type: String,
    ref: 'User'
  },
  profileComplete: {
    type: Boolean,
    default: false
  },
  profileCompletedAt: {
    type: Date,
    default: null
  },
  aadharCard: {
    type: String,
    trim: true,
    default: ''
  },
  panCard: {
    type: String,
    trim: true,
    default: ''
  },
  bankAccount: {
    accountNumber: { type: String, trim: true, default: '' },
    bankName: { type: String, trim: true, default: '' },
    ifscCode: { type: String, trim: true, default: '' },
    branchName: { type: String, trim: true, default: '' }
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', ''],
    default: ''
  },
  emergencyContact: {
    name: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    relation: { type: String, trim: true, default: '' }
  },
  profilePhoto: {
    type: String,
    default: ''
  },
  settings: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  activityHistory: [{
    action: { type: String, required: true },
    description: { type: String, required: true },
    entityType: { type: String, default: '' },
    entityId: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
// agentSchema.index({ email: 1 }); // Removed duplicate index
agentSchema.index({ tenantId: 1 });
agentSchema.index({ institutionId: 1 });
agentSchema.index({ status: 1 });
agentSchema.index({ name: 1 });
agentSchema.index({ createdAt: -1 });

// Virtual for full address
agentSchema.virtual('fullAddress').get(function() {
  return `${this.address}, ${this.city}, ${this.state} ${this.postalCode}, ${this.country}`;
});

// Pre-save middleware to ensure data integrity
agentSchema.pre('save', function(next) {
  // Ensure email is lowercase
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  
  // Trim all string fields
  const stringFields = ['name', 'email', 'phone', 'address', 'city', 'state', 'country', 'postalCode', 'notes'];
  stringFields.forEach(field => {
    if (this[field]) {
      this[field] = this[field].trim();
    }
  });
  
  next();
});

// Static method to find active agents
agentSchema.statics.findActive = function(tenantId) {
  return this.find({ tenantId, status: 'Active' });
};

// Static method to get agent statistics
agentSchema.statics.getStatistics = function(tenantId) {
  return this.aggregate([
    { $match: { tenantId: mongoose.Types.ObjectId(tenantId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgCommission: { $avg: '$commissionRate' }
      }
    }
  ]);
};

const Agent = mongoose.model('Agent', agentSchema);

export default Agent;
