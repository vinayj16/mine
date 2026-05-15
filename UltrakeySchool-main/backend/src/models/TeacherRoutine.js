import mongoose from 'mongoose';

const teacherRoutineSchema = new mongoose.Schema({
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
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6,
    index: true
  },
  periods: [{
    periodNumber: {
      type: Number,
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
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section'
    },
    roomNumber: String,
    periodType: {
      type: String,
      enum: ['lecture', 'lab', 'tutorial', 'break', 'free'],
      default: 'lecture'
    }
  }],
  academicYear: {
    type: String,
    required: true
  },
  term: {
    type: String,
    enum: ['1', '2', '3', 'annual'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

teacherRoutineSchema.index({ schoolId: 1, teacherId: 1, dayOfWeek: 1 });
teacherRoutineSchema.index({ schoolId: 1, academicYear: 1, term: 1 });

const TeacherRoutine = mongoose.model('TeacherRoutine', teacherRoutineSchema);

export default TeacherRoutine;
