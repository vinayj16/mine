import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  duration: Number, // in hours
  order: Number,
  isCompleted: { type: Boolean, default: false },
  completedDate: Date
}, { _id: true });

const syllabusSchema = new mongoose.Schema({
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
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  term: {
    type: String,
    enum: ['1', '2', '3', 'annual'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  objectives: [String],
  topics: [topicSchema],
  totalHours: {
    type: Number,
    default: 0
  },
  textbook: String,
  referenceBooks: [String],
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

syllabusSchema.index({ schoolId: 1, classId: 1, subjectId: 1 });
syllabusSchema.index({ academicYear: 1, term: 1 });

export default mongoose.model('Syllabus', syllabusSchema);
