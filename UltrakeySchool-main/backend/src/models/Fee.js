import mongoose from 'mongoose';

const currentYear = new Date().getFullYear();

const feeSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Made optional for class-level fees
    index: true
  },
  feeType: {
    type: String,
    required: false, // Made optional with default
    default: 'other',
    enum: ['tuition', 'transport', 'library', 'sports', 'exam', 'hostel', 'annual', 'monthly', 'other'],
    index: true
  },
  amount: {
    type: Number,
    required: false, // Made optional with default
    default: 0,
    min: 0
  },
  dueDate: {
    type: Date,
    required: false, // Made optional with default
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'partial', 'overdue', 'waived'],
    default: 'pending',
    index: true
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    uppercase: true
  },
  academicYear: {
    type: String,
    required: false, // Made optional with default
    default: `${currentYear}-${currentYear + 1}`
  },
  term: {
    type: String,
    enum: ['term1', 'term2', 'term3', 'annual', 'monthly'],
    required: false, // Made optional with default
    default: 'term1'
  },
  month: {
    type: Number,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: false, // Made optional with default
    default: currentYear
  },
  paymentHistory: [{
    amount: Number,
    paymentDate: Date,
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'cheque', 'online', 'upi']
    },
    transactionId: String,
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    remarks: String
  }],
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountReason: String,
  lateFee: {
    type: Number,
    default: 0,
    min: 0
  },
  remarks: String,
  remindersSent: {
    type: Number,
    default: 0
  },
  lastReminderDate: Date,
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  items: [{
    description: String,
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    amount: {
      type: Number,
      default: 0,
      min: 0
    },
    tax: {
      type: Number,
      default: 0
    }
  }],
  totalAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  payments: [{
    paymentId: String,
    orderId: String,
    amount: Number,
    paymentMethod: String,
    status: String,
    paymentUrl: String,
    expiresAt: Date,
    razorpayOrderId: String,
    verifiedAt: Date,
    failureReason: String
  }],
  notes: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

feeSchema.index({ schoolId: 1, status: 1, dueDate: 1 });
feeSchema.index({ schoolId: 1, year: 1, month: 1 });
feeSchema.index({ schoolId: 1, term: 1, academicYear: 1 });

feeSchema.pre('save', function(next) {
  this.remainingAmount = this.amount - this.paidAmount + this.lateFee - this.discount;
  
  if (this.remainingAmount <= 0) {
    this.status = 'paid';
  } else if (this.paidAmount > 0) {
    this.status = 'partial';
  } else if (new Date() > this.dueDate) {
    this.status = 'overdue';
  }
  
  next();
});

export default mongoose.model('Fee', feeSchema);
