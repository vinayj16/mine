import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  orderId: {
    type: String,
    required: true
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fee',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    uppercase: true
  },
  paymentMethod: {
    type: String,
    default: 'online'
  },
  status: {
    type: String,
    enum: ['created', 'completed', 'failed', 'expired'],
    default: 'created',
    index: true
  },
  paymentUrl: String,
  razorpayOrderId: String,
  expiresAt: Date,
  verifiedAt: Date,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  failureReason: String,
  responsePayload: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

export default mongoose.model('Payment', paymentSchema);
