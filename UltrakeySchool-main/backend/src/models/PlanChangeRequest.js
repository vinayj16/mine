import mongoose from 'mongoose';

const planChangeRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    unique: true
  },

  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
    index: true
  },

  currentPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MembershipPlan',
    required: true
  },

  currentPlanName: {
    type: String,
    required: true
  },

  requestedPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MembershipPlan',
    required: true
  },

  requestedPlanName: {
    type: String,
    required: true
  },

  changeType: {
    type: String,
    enum: ['upgrade', 'downgrade', 'switch'],
    required: true
  },

  reason: {
    type: String,
    required: true,
    trim: true
  },

  effectiveDate: {
    type: Date,
    required: true
  },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },

  pricing: {
    currentPrice: Number,
    newPrice: Number,
    priceDifference: Number,
    proratedAmount: Number,
    currency: { type: String, default: 'INR' }
  },

  paymentRequired: {
    type: Boolean,
    default: false
  },

  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'waived'],
    default: 'pending'
  },

  paymentDetails: {
    paymentId: String,
    paymentMethod: String,
    paidAt: Date,
    transactionId: String
  },

  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  reviewedAt: {
    type: Date
  },

  reviewNotes: {
    type: String,
    trim: true
  },

  rejectionReason: {
    type: String,
    trim: true
  },

  completedAt: {
    type: Date
  },

  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

planChangeRequestSchema.index({ institutionId: 1, status: 1 });
planChangeRequestSchema.index({ institutionId: 1, status: 1 });
planChangeRequestSchema.index({ status: 1, createdAt: -1 });
planChangeRequestSchema.index({ effectiveDate: 1 });

planChangeRequestSchema.pre('save', async function(next) {
  if (this.isNew && !this.requestId) {
    const count = await mongoose.model('PlanChangeRequest').countDocuments();
    this.requestId = `PCR${String(count + 1).padStart(6, '0')}`;
  }

  // Calculate price difference
  if (this.pricing.currentPrice !== undefined && this.pricing.newPrice !== undefined) {
    this.pricing.priceDifference = this.pricing.newPrice - this.pricing.currentPrice;
    this.paymentRequired = this.pricing.priceDifference > 0;
  }

  next();
});

const PlanChangeRequest = mongoose.model('PlanChangeRequest', planChangeRequestSchema);

export default PlanChangeRequest;
