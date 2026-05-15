import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  invoiceId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['subscription', 'upgrade', 'addon', 'refund', 'adjustment'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_transfer', 'paypal', 'other'],
    required: true
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

transactionSchema.index({ schoolId: 1, status: 1 });
transactionSchema.index({ invoiceId: 1 });
transactionSchema.index({ createdAt: -1 });

export default mongoose.model('Transaction', transactionSchema);
