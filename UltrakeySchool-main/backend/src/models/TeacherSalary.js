import mongoose from 'mongoose';

const teacherSalarySchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
    index: true
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
    required: true
  },
  allowances: {
    hra: { type: Number, default: 0 },
    da: { type: Number, default: 0 },
    ta: { type: Number, default: 0 },
    medical: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  deductions: {
    pf: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    insurance: { type: Number, default: 0 },
    loan: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  totalAllowances: {
    type: Number,
    default: 0
  },
  totalDeductions: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    required: true
  },
  paymentDate: {
    type: Date
  },
  paymentMode: {
    type: String,
    enum: ['bank_transfer', 'cash', 'cheque'],
    default: 'bank_transfer'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed'],
    default: 'pending',
    index: true
  },
  transactionId: {
    type: String
  },
  remarks: {
    type: String,
    trim: true
  },
  workingDays: {
    type: Number,
    required: true
  },
  presentDays: {
    type: Number,
    required: true
  },
  leaveDays: {
    type: Number,
    default: 0
  },
  overtimeHours: {
    type: Number,
    default: 0
  },
  overtimeAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

teacherSalarySchema.index({ schoolId: 1, teacherId: 1, year: -1, month: -1 });
teacherSalarySchema.index({ schoolId: 1, paymentStatus: 1 });

teacherSalarySchema.pre('save', function(next) {
  this.totalAllowances = Object.values(this.allowances).reduce((sum, val) => sum + val, 0);
  this.totalDeductions = Object.values(this.deductions).reduce((sum, val) => sum + val, 0);
  this.netSalary = this.basicSalary + this.totalAllowances + this.overtimeAmount - this.totalDeductions;
  next();
});

const TeacherSalary = mongoose.model('TeacherSalary', teacherSalarySchema);

export default TeacherSalary;
