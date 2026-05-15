import mongoose from 'mongoose';

const pendingInstitutionRegistrationSchema = new mongoose.Schema({
  // Basic Institution Info
  instituteType: {
    type: String,
    enum: ['School', 'Inter College', 'Degree College'],
    required: true
  },
  instituteCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },

  // Contact Person Info (Institution Owner)
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },

  // Registration Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  // Terms Agreement
  agreedToTerms: {
    type: Boolean,
    required: true,
    default: false
  },

  // Registration Metadata
  registrationDate: {
    type: Date,
    default: Date.now
  },

  // Superadmin Review Data (when approved)
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  reviewNotes: String,

  // Created Institution Reference (when approved)
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution'
  },

  ownerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Rejection Reason (if rejected)
  rejectionReason: String
}, {
  timestamps: true
});

// Indexes for performance
pendingInstitutionRegistrationSchema.index({ status: 1 });
pendingInstitutionRegistrationSchema.index({ registrationDate: -1 });

// Virtual for checking if expired (pending registrations expire after 30 days)
pendingInstitutionRegistrationSchema.virtual('isExpired').get(function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return this.registrationDate < thirtyDaysAgo && this.status === 'pending';
});

// Method to approve registration
pendingInstitutionRegistrationSchema.methods.approve = function(reviewerId, institutionId, notes = '') {
  this.status = 'approved';
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.institutionId = institutionId;
  this.reviewNotes = notes;
  return this.save();
};

// Method to reject registration
pendingInstitutionRegistrationSchema.methods.reject = function(reviewerId, reason = '') {
  this.status = 'rejected';
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.rejectionReason = reason;
  return this.save();
};

export default mongoose.model('PendingInstitutionRegistration', pendingInstitutionRegistrationSchema);
