import mongoose from 'mongoose';

const registrationRequestSchema = new mongoose.Schema({
  instituteType: {
    type: String,
    required: true,
    enum: ['school', 'inter', 'degree', 'engineering'],
    trim: true
  },
  instituteCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    minlength: 3,
    maxlength: 20
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    maxlength: 128
  },
  confirmPassword: {
    type: String,
    required: true
  },
  agreed: {
    type: Boolean,
    required: true,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    default: null
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
registrationRequestSchema.index({ status: 1, createdAt: -1 });
registrationRequestSchema.index({ email: 1 }, { unique: false });
registrationRequestSchema.index({ instituteCode: 1 }, { unique: false });

// Pre-save middleware to update timestamp
registrationRequestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find pending requests
registrationRequestSchema.statics.findPendingRequests = function() {
  return this.find({ status: 'pending' }).sort({ createdAt: -1 });
};

// Static method to find by status
registrationRequestSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Instance method to approve request
registrationRequestSchema.methods.approve = function(assignedBy) {
  this.status = 'approved';
  this.assignedBy = assignedBy;
  this.assignedAt = new Date();
  return this.save();
};

// Instance method to reject request
registrationRequestSchema.methods.reject = function(reason, assignedBy) {
  this.status = 'rejected';
  this.rejectionReason = reason;
  this.assignedBy = assignedBy;
  this.assignedAt = new Date();
  return this.save();
};

// Instance method to mark as completed
registrationRequestSchema.methods.complete = function(institutionId) {
  this.status = 'completed';
  this.institutionId = institutionId;
  this.completedAt = new Date();
  return this.save();
};

export default mongoose.model('RegistrationRequest', registrationRequestSchema);