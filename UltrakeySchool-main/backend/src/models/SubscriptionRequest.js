import mongoose from 'mongoose';

const subscriptionRequestSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  planId: {
    type: String,
    required: true,
    enum: ['basic', 'standard', 'premium', 'enterprise']
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD']
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'upi', 'net_banking']
  },
  status: {
    type: String,
    enum: ['pending_verification', 'active', 'rejected', 'cancelled'],
    default: 'pending_verification'
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: Date,
  rejectionReason: String
}, {
  timestamps: true
});

const SubscriptionRequest = mongoose.model('SubscriptionRequest', subscriptionRequestSchema);

export default SubscriptionRequest;