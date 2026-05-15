import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema({
  payrollId: {
    type: String,
    required: true,
    unique: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  basicSalary: {
    type: Number,
    required: true,
    min: 0
  },
  allowances: {
    type: Number,
    default: 0,
    min: 0
  },
  deductions: {
    type: Number,
    default: 0,
    min: 0
  },
  netSalary: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['paid', 'generated', 'pending'],
    default: 'pending'
  },
  paymentDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['bank-transfer', 'cash', 'cheque'],
    default: 'bank-transfer'
  },
  notes: {
    type: String,
    trim: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
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
payrollSchema.index({ institution: 1, employee: 1, month: 1, year: 1 });
payrollSchema.index({ status: 1 });
payrollSchema.index({ month: 1, year: 1 });

export default mongoose.model('Payroll', payrollSchema);
