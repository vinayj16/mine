import mongoose from 'mongoose';

const examAttendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    default: 'present'
  },
  arrivalTime: String,
  notes: String
}, { _id: true });

const examSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['written', 'oral', 'practical', 'objective', 'assignment', 'quiz'],
    default: 'written'
  },
  examDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  totalMarks: {
    type: Number,
    required: true
  },
  passingMarks: {
    type: Number
  },
  instructions: String,
  roomNumber: String,
  invigilator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  attendance: [examAttendanceSchema],
  academicYear: {
    type: String,
    required: true
  },
  term: {
    type: String,
    enum: ['1', '2', '3', 'annual'],
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

examSchema.index({ schoolId: 1, classId: 1, examDate: 1 });
examSchema.index({ academicYear: 1, term: 1 });

export default mongoose.model('Exam', examSchema);
