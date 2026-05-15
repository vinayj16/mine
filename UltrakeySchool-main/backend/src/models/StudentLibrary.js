import mongoose from 'mongoose';

const studentLibrarySchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
    index: true
  },
  bookTitle: {
    type: String,
    required: true
  },
  bookISBN: {
    type: String
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  dueDate: {
    type: Date,
    required: true,
    index: true
  },
  returnDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['issued', 'returned', 'overdue', 'lost'],
    default: 'issued',
    index: true
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  returnedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  fineAmount: {
    type: Number,
    default: 0
  },
  finePaid: {
    type: Boolean,
    default: false
  },
  finePaymentDate: {
    type: Date
  },
  renewalCount: {
    type: Number,
    default: 0
  },
  renewalHistory: [{
    renewedDate: Date,
    newDueDate: Date,
    renewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  condition: {
    atIssue: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    },
    atReturn: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'damaged']
    }
  },
  remarks: {
    type: String
  }
}, {
  timestamps: true
});

studentLibrarySchema.index({ schoolId: 1, studentId: 1, status: 1 });
studentLibrarySchema.index({ dueDate: 1, status: 1 });

studentLibrarySchema.methods.calculateFine = function() {
  if (this.status === 'returned' || !this.dueDate) return 0;
  
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  
  if (today <= dueDate) return 0;
  
  const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
  const finePerDay = 5;
  
  this.fineAmount = daysOverdue * finePerDay;
  return this.fineAmount;
};

studentLibrarySchema.methods.markReturned = function(userId) {
  this.status = 'returned';
  this.returnDate = new Date();
  this.returnedTo = userId;
  this.calculateFine();
  return this.save();
};

const StudentLibrary = mongoose.model('StudentLibrary', studentLibrarySchema);

export default StudentLibrary;
