import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String },
  size: { type: Number }
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['submitted', 'late', 'graded', 'not_submitted'],
    default: 'not_submitted'
  },
  marks: {
    type: Number
  },
  feedback: {
    type: String
  },
  attachments: [attachmentSchema]
}, { _id: true });

const homeWorkSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section'
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  instructions: {
    type: String
  },
  dueDate: {
    type: Date,
    required: true
  },
  totalMarks: {
    type: Number,
    default: 100
  },
  attachments: [attachmentSchema],
  submissions: [submissionSchema],
  academicYear: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
homeWorkSchema.index({ schoolId: 1, classId: 1 });
homeWorkSchema.index({ schoolId: 1, subjectId: 1 });
homeWorkSchema.index({ schoolId: 1, teacherId: 1 });
homeWorkSchema.index({ dueDate: 1 });
homeWorkSchema.index({ status: 1 });

// Virtual for submission count
homeWorkSchema.virtual('submissionCount').get(function() {
  return this.submissions.filter(s => s.status === 'submitted').length;
});

// Virtual for graded count
homeWorkSchema.virtual('gradedCount').get(function() {
  return this.submissions.filter(s => s.status === 'graded').length;
});

homeWorkSchema.set('toJSON', { virtuals: true });
homeWorkSchema.set('toObject', { virtuals: true });

export default mongoose.model('HomeWork', homeWorkSchema);
