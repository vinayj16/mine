import mongoose from 'mongoose';

const classScheduleSchema = new mongoose.Schema({
  scheduleId: {
    type: String,
    required: true,
    unique: true,
    index: true
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
  
  teacher: {
    type: String,
    required: true
  },
  
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
    index: true
  },
  
  room: {
    type: String,
    required: true,
    trim: true
  },
  
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
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
    type: Number,
    default: 60
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled'],
    default: 'active',
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
  
  recurrence: {
    type: String,
    enum: ['weekly', 'biweekly', 'monthly', 'once'],
    default: 'weekly'
  },
  
  notes: {
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

classScheduleSchema.index({ classId: 1, day: 1, startTime: 1 });
classScheduleSchema.index({ teacherId: 1, day: 1, startTime: 1 });
classScheduleSchema.index({ institutionId: 1, academicYear: 1, status: 1 });
classScheduleSchema.index({ day: 1, startTime: 1, room: 1 });

classScheduleSchema.pre('save', async function(next) {
  if (this.isNew && !this.scheduleId) {
    const count = await mongoose.model('ClassSchedule').countDocuments();
    this.scheduleId = `SC${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

const ClassSchedule = mongoose.model('ClassSchedule', classScheduleSchema);

export default ClassSchedule;
