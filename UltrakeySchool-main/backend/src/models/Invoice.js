import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true }
});

const invoiceSchema = new mongoose.Schema({
  invoiceId: { type: String, required: true, unique: true },
  invoiceNumber: { type: String, required: true, unique: true },
  
  // Student Information
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String },
  rollNumber: { type: String },
  class: { type: String },
  section: { type: String },
  
  // Fee Information
  feeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fee' },
  feeType: { type: String, required: true },
  description: { type: String },
  
  // Financial Details
  amount: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  
  // Payment Details
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'partial', 'overdue', 'cancelled'], 
    default: 'pending' 
  },
  paidAmount: { type: Number, default: 0 },
  paidDate: { type: Date },
  paymentMethod: { 
    type: String, 
    enum: ['cash', 'card', 'online', 'bank_transfer', 'cheque', 'upi', 'wallet'],
    default: 'online'
  },
  transactionId: { type: String },
  
  // Due Date
  dueDate: { type: Date, required: true },
  
  // Institution/School
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution' },
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution' },
  
  // Items (for detailed breakdown)
  items: [invoiceItemSchema],
  
  // Notes
  notes: { type: String },
  
  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Email Notification
  emailSent: { type: Boolean, default: false },
  emailSentAt: { type: Date },
  
}, { timestamps: true });

// Indexes
invoiceSchema.index({ invoiceId: 1 });
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ studentId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ schoolId: 1 });
invoiceSchema.index({ createdAt: -1 });

// Generate invoice number before saving
invoiceSchema.pre('save', function(next) {
  if (!this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    this.invoiceNumber = `INV-${year}${month}-${random}`;
  }
  if (!this.invoiceId) {
    this.invoiceId = this.invoiceNumber;
  }
  next();
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
