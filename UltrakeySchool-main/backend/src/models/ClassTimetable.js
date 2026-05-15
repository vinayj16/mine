import mongoose from 'mongoose';

const classPeriodSchema = new mongoose.Schema({
  periodNumber: { type: Number, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  roomNumber: String,
  periodType: { 
    type: String, 
    enum: ['lecture', 'lab', 'break', 'lunch', 'assembly', 'sports', 'library', 'other'],
    default: 'lecture'
  }
}, { _id: true });

const classTimetableSchema = new mongoose.Schema({
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
  academicYear: {
    type: String,
    required: true
  },
  dayOfWeek: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  periods: [classPeriodSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

classTimetableSchema.index({ schoolId: 1, classId: 1, dayOfWeek: 1 });
classTimetableSchema.index({ academicYear: 1, isActive: 1 });

export default mongoose.model('ClassTimetable', classTimetableSchema);
