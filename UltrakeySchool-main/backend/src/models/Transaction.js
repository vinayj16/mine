import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution'
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  invoiceId: {
    type: String
  },
  type: {
    type: String,
    enum: ['subscription', 'upgrade', 'addon', 'refund', 'adjustment', 'payment', 'module'],
    required: true
  },
  description: {
    type: String
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_transfer', 'paypal', 'other', 'UPI', 'Bank', 'Cash'],
    default: 'other'
  },
  plan: {
    type: String
  },
  paymentDetails: {
    cardBrand: String,
    lastFour: String,
    transactionReference: String,
    gatewayResponse: String
  },
  billingInfo: {
    name: String,
    email: String,
    address: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  metadata: {
    planId: String,
    planName: String,
    billingCycle: String,
    previousPlanId: String,
    discount: {
      code: String,
      amount: Number
    }
  },
  refundInfo: {
    refundedAt: Date,
    refundAmount: Number,
    refundReason: String,
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

transactionSchema.index({ institutionId: 1, status: 1 });
transactionSchema.index({ institutionId: 1, status: 1 });
transactionSchema.index({ invoiceId: 1 });
transactionSchema.index({ createdAt: -1 });

export default mongoose.model('Transaction', transactionSchema);
