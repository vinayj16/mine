import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  isbn: {
    type: String,
    unique: true,
    sparse: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  author: {
    type: String,
    required: true,
    trim: true,
  },
  publisher: {
    type: String,
    trim: true,
  },
  publishedYear: {
    type: Number,
  },
  category: {
    type: String,
    required: true,
    enum: ['Fiction', 'Non-Fiction', 'Science', 'Mathematics', 'History', 'Geography', 'Literature', 'Reference', 'Magazine', 'Other'],
  },
  language: {
    type: String,
    default: 'English',
  },
  totalCopies: {
    type: Number,
    required: true,
    default: 1,
  },
  availableCopies: {
    type: Number,
    required: true,
    default: 1,
  },
  location: {
    shelf: String,
    rack: String,
    floor: String,
  },
  price: {
    type: Number,
  },
  description: {
    type: String,
  },
  coverImage: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Damaged', 'Lost'],
    default: 'Active',
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
}, {
  timestamps: true,
});

const issueSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userType: {
    type: String,
    enum: ['Student', 'Teacher', 'Staff'],
    required: true,
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  returnDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['Issued', 'Returned', 'Overdue', 'Lost'],
    default: 'Issued',
  },
  fine: {
    type: Number,
    default: 0,
  },
  fineStatus: {
    type: String,
    enum: ['None', 'Pending', 'Paid'],
    default: 'None',
  },
  remarks: {
    type: String,
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  returnedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
}, {
  timestamps: true,
});

const reservationSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reservationDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Fulfilled', 'Expired', 'Cancelled'],
    default: 'Active',
  },
  notificationSent: {
    type: Boolean,
    default: false,
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes
bookSchema.index({ title: 'text', author: 'text', isbn: 'text' });
bookSchema.index({ tenant: 1, category: 1 });
issueSchema.index({ tenant: 1, user: 1, status: 1 });
issueSchema.index({ dueDate: 1, status: 1 });
reservationSchema.index({ tenant: 1, user: 1, status: 1 });

// Virtual for borrowed copies
bookSchema.virtual('borrowedCopies').get(function() {
  return this.totalCopies - this.availableCopies;
});

// Methods
issueSchema.methods.calculateFine = function(finePerDay = 5) {
  if (this.status === 'Returned' && this.returnDate > this.dueDate) {
    const daysLate = Math.ceil((this.returnDate - this.dueDate) / (1000 * 60 * 60 * 24));
    return daysLate * finePerDay;
  }
  if (this.status === 'Issued' && new Date() > this.dueDate) {
    const daysLate = Math.ceil((new Date() - this.dueDate) / (1000 * 60 * 60 * 24));
    return daysLate * finePerDay;
  }
  return 0;
};

export const Book = mongoose.model('Book', bookSchema);
export const BookIssue = mongoose.model('BookIssue', issueSchema);
export const BookReservation = mongoose.model('BookReservation', reservationSchema);
