import mongoose from 'mongoose';

const studentTimetableSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
    index: true
  },
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section'
  },
  academicYear: {
    type: String,
    required: true,
    index: true
  },
  dayOfWeek: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true,
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
    subjectName: {
      type: String
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher'
    },
    teacherName: {
      type: String
    },
    roomNumber: {
      type: String
    },
    periodType: {
      type: String,
      enum: ['lecture', 'lab', 'break', 'lunch', 'assembly', 'sports', 'library', 'other'],
      default: 'lecture'
    },
    isBreak: {
      type: Boolean,
      default: false
    }
  }],
  effectiveFrom: {
    type: Date,
    required: true,
    default: Date.now
  },
  effectiveTo: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

studentTimetableSchema.index({ schoolId: 1, classId: 1, dayOfWeek: 1, isActive: 1 });
studentTimetableSchema.index({ academicYear: 1, isActive: 1 });

const StudentTimetable = mongoose.model('StudentTimetable', studentTimetableSchema);

export default StudentTimetable;
