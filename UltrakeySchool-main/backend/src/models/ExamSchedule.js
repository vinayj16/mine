import mongoose from 'mongoose';

const examScheduleSchema = new mongoose.Schema({
  scheduleId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam'
  },
  
  examName: {
    type: String,
    required: true,
    trim: true
  },
  
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
    index: true
  },
  
  className: {
    type: String,
    required: true
  },
  
  section: {
    type: String,
    required: true,
    uppercase: true
  },
  
  subject: {
    type: String,
    required: true,
    trim: true
  },
  
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  
  examDate: {
    type: Date,
    required: true,
    index: true
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
    type: String,
    required: true
  },
  
  roomNo: {
    type: String,
    required: true,
    trim: true
  },
  
  maxMarks: {
    type: Number,
    required: true,
    min: 0
  },
  
  minMarks: {
    type: Number,
    required: true,
    min: 0
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed', 'cancelled'],
    default: 'active',
    lowercase: true,
    index: true
  },
  
  academicYear: {
    type: String,
    required: true
  },
  
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
    index: true
  },
  
  invigilator: {
    type: String,
    trim: true
  },
  
  invigilatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  
  instructions: {
    type: String,
    trim: true
  },
  
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

examScheduleSchema.index({ classId: 1, examDate: 1, subject: 1 });
examScheduleSchema.index({ institutionId: 1, academicYear: 1, status: 1 });
examScheduleSchema.index({ examDate: 1, startTime: 1, roomNo: 1 });

examScheduleSchema.pre('save', async function(next) {
  if (this.isNew && !this.scheduleId) {
    const count = await mongoose.model('ExamSchedule').countDocuments();
    this.scheduleId = `ES${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

examScheduleSchema.pre('save', function(next) {
  if (this.minMarks > this.maxMarks) {
    next(new Error('Minimum marks cannot be greater than maximum marks'));
  }
  next();
});

const ExamSchedule = mongoose.model('ExamSchedule', examScheduleSchema);

export default ExamSchedule;
