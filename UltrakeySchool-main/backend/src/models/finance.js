import mongoose from 'mongoose';

const feeStructureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['tuition', 'transport', 'hostel', 'library', 'exam', 'other'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  frequency: {
    type: String,
    enum: ['one-time', 'monthly', 'quarterly', 'yearly', 'per-exam'],
    default: 'yearly'
  },
  grade: {
    type: String,
    required: true // e.g., '1', '2', '3', ..., '12', 'all'
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  academicYear: {
    type: String,
    required: true // e.g., '2024-2025'
  }
}, {
  timestamps: true
});

// Indexes
feeStructureSchema.index({ institution: 1, grade: 1, category: 1 });
feeStructureSchema.index({ academicYear: 1 });
feeStructureSchema.index({ isActive: 1 });

const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);

// Invoice Schema
const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  items: [{
    feeStructure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeStructure'
    },
    description: String,
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      default: 1
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
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
    enum: ['cash', 'card', 'bank-transfer', 'online', 'cheque']
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  academicYear: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Indexes
invoiceSchema.index({ student: 1, status: 1 });
invoiceSchema.index({ institution: 1, status: 1 });
invoiceSchema.index({ dueDate: 1, status: 1 });
invoiceSchema.index({ academicYear: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  type: {
    type: String,
    enum: ['payment', 'refund', 'fee-waiver', 'adjustment'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank-transfer', 'online', 'cheque', 'other'],
    required: true
  },
  reference: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  processedAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ institution: 1, type: 1, status: 1 });
transactionSchema.index({ student: 1, type: 1 });
transactionSchema.index({ invoice: 1 });
transactionSchema.index({ processedAt: -1 });

const FinanceTransaction = mongoose.model('FinanceTransaction', transactionSchema);

// Budget Schema
const budgetSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  category: {
    type: String,
    enum: ['education', 'infrastructure', 'staff', 'utilities', 'maintenance', 'transport', 'library', 'sports', 'other'],
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  plannedAmount: {
    type: Number,
    required: true,
    min: 0
  },
  spentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingAmount: {
    type: Number,
    default: function() {
      return this.plannedAmount - this.spentAmount;
    }
  },
  status: {
    type: String,
    enum: ['draft', 'approved', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  approvalDate: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
budgetSchema.index({ institution: 1, academicYear: 1, category: 1 });
budgetSchema.index({ status: 1 });
budgetSchema.index({ createdBy: 1 });

const Budget = mongoose.model('Budget', budgetSchema);

// Salary Schema
const salarySchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  basicSalary: {
    type: Number,
    required: true,
    min: 0
  },
  allowances: [{
    type: {
      type: String,
      enum: ['house-rent', 'conveyance', 'medical', 'special', 'other'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    description: String
  }],
  deductions: [{
    type: {
      type: String,
      enum: ['tax', 'insurance', 'loan', 'provident-fund', 'other'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    description: String
  }],
  grossSalary: {
    type: Number,
    required: true,
    min: 0
  },
  netSalary: {
    type: Number,
    required: true,
    min: 0
  },
  paymentDate: {
    type: Date,
    required: true
  },
  month: {
    type: String,
    required: true // e.g., '2024-01'
  },
  year: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'paid', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['bank-transfer', 'cash', 'cheque', 'online']
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
salarySchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });
salarySchema.index({ institution: 1, month: 1, year: 1 });
salarySchema.index({ status: 1, paymentDate: 1 });

const Salary = mongoose.model('Salary', salarySchema);

export {
  FeeStructure,
  Invoice,
  FinanceTransaction,
  Budget,
  Salary
};

export default {
  FeeStructure,
  Invoice,
  FinanceTransaction,
  Budget,
  Salary
};
