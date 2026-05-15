import mongoose from 'mongoose';

const teacherLibrarySchema = new mongoose.Schema({
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
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  dueDate: {
    type: Date,
    required: true
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
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

teacherLibrarySchema.index({ schoolId: 1, teacherId: 1, status: 1 });
teacherLibrarySchema.index({ schoolId: 1, bookId: 1 });

teacherLibrarySchema.methods.calculateFine = function() {
  if (this.status === 'issued' && new Date() > this.dueDate) {
    const daysOverdue = Math.ceil((new Date() - this.dueDate) / (1000 * 60 * 60 * 24));
    this.fineAmount = daysOverdue * 5;
    this.status = 'overdue';
  }
  return this.fineAmount;
};

const TeacherLibrary = mongoose.model('TeacherLibrary', teacherLibrarySchema);

export default TeacherLibrary;
