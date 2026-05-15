import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: String,
  role: String,
  avatar: String,
  email: String
}, { _id: false });

const scheduleSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['meeting', 'class', 'event', 'exam', 'vacation'],
    required: true,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  date: {
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
  location: {
    type: String,
    trim: true
  },
  virtualLink: {
    type: String,
    trim: true
  },
  participants: [participantSchema],
  organizer: participantSchema,
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming',
    index: true
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrencePattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    trim: true
  },
  recurrenceEndDate: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true
  },
  reminders: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reminderTime: Date,
    sent: {
      type: Boolean,
      default: false
    }
  }],
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

scheduleSchema.index({ schoolId: 1, date: 1, status: 1 });
scheduleSchema.index({ schoolId: 1, type: 1, date: 1 });
scheduleSchema.index({ 'participants.userId': 1, date: 1 });
scheduleSchema.index({ tags: 1 });

scheduleSchema.pre('save', function(next) {
  const now = new Date();
  const scheduleDate = new Date(this.date);
  
  if (scheduleDate < now && this.status === 'upcoming') {
    this.status = 'completed';
  }
  
  next();
});

export default mongoose.model('Schedule', scheduleSchema);
