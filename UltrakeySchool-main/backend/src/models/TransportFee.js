import mongoose from 'mongoose';

const transportFeeSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  studentTransportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentTransport',
    required: true,
    index: true
  },
  feeAmount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue', 'waived'],
    default: 'pending',
    index: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'netbanking', 'cheque', 'dd', 'online']
  },
  paymentReference: {
    type: String
  },
  paymentDetails: {
    transactionId: String,
    gateway: String,
    receiptUrl: String
  },
  academicYear: {
    type: String,
    required: true
  },
  term: {
    type: String,
    enum: ['first', 'second', 'third', 'annual'],
    default: 'annual'
  },
  discount: {
    type: Number,
    default: 0
  },
  discountReason: {
    type: String
  },
  lateFee: {
    type: Number,
    default: 0
  },
  remarks: {
    type: String
  },
  collectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

transportFeeSchema.index({ schoolId: 1, studentId: 1, academicYear: 1 });
transportFeeSchema.index({ institutionId: 1, paymentStatus: 1 });
transportFeeSchema.index({ dueDate: 1, paymentStatus: 1 });

const TransportFee = mongoose.models.TransportFee || mongoose.model('TransportFee', transportFeeSchema);

export default TransportFee;
