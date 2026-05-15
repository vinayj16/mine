import mongoose from 'mongoose';

// Announcement Schema
const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  summary: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['academic', 'administrative', 'event', 'general', 'urgent'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  targetAudience: [{
    type: String,
    enum: ['all', 'students', 'teachers', 'parents', 'staff', 'administration']
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishedDate: {
    type: Date
  },
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  expiryDate: {
    type: Date
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [String],
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
announcementSchema.index({ institution: 1, status: 1 });
announcementSchema.index({ targetAudience: 1 });
announcementSchema.index({ publishedDate: -1 });
announcementSchema.index({ category: 1 });

const Announcement = mongoose.model('Announcement', announcementSchema);

// Event Schema
const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['academic', 'cultural', 'sports', 'administrative', 'holiday', 'other'],
    required: true
  },
  category: {
    type: String,
    enum: ['school', 'class', 'department', 'institution', 'public'],
    default: 'school'
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true // HH:MM format
  },
  endTime: {
    type: String,
    required: true // HH:MM format
  },
  venue: {
    name: String,
    address: String,
    capacity: Number
  },
  coordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  targetAudience: [{
    type: String,
    enum: ['all', 'students', 'teachers', 'parents', 'staff', 'administration']
  }],
  status: {
    type: String,
    enum: ['planned', 'confirmed', 'ongoing', 'completed', 'cancelled'],
    default: 'planned'
  },
  budget: {
    type: Number,
    min: 0
  },
  requirements: [String],
  agenda: [{
    time: String,
    activity: String,
    duration: String
  }],
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  feedback: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }],
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
eventSchema.index({ institution: 1, status: 1 });
eventSchema.index({ date: 1, status: 1 });
eventSchema.index({ type: 1 });
eventSchema.index({ targetAudience: 1 });

const Event = mongoose.model('Event', eventSchema);

// Report Schema
const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['academic', 'attendance', 'financial', 'disciplinary', 'infrastructure', 'other'],
    required: true
  },
  category: {
    type: String,
    enum: ['monthly', 'quarterly', 'annual', 'custom'],
    default: 'monthly'
  },
  parameters: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  summary: {
    type: String,
    trim: true
  },
  recommendations: [String],
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed'],
    default: 'generating'
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  format: {
    type: String,
    enum: ['json', 'pdf', 'excel', 'csv'],
    default: 'json'
  },
  fileUrl: {
    type: String,
    trim: true
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    },
    accessLevel: {
      type: String,
      enum: ['view', 'download', 'edit'],
      default: 'view'
    }
  }],
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
reportSchema.index({ institution: 1, type: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ generatedAt: -1 });
reportSchema.index({ generatedBy: 1 });

const Report = mongoose.model('Report', reportSchema);

// Meeting Schema (for parent-teacher meetings)
const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['parent-teacher', 'staff', 'disciplinary', 'academic-review', 'other'],
    default: 'parent-teacher'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true // HH:MM format
  },
  endTime: {
    type: String,
    required: true // HH:MM format
  },
  venue: {
    name: String,
    address: String
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['organizer', 'teacher', 'parent', 'student', 'staff', 'principal'],
      required: true
    },
    status: {
      type: String,
      enum: ['invited', 'confirmed', 'attended', 'cancelled', 'no-show'],
      default: 'invited'
    }
  }],
  agenda: [{
    topic: String,
    duration: Number, // minutes
    presenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  minutes: {
    type: String,
    trim: true
  },
  decisions: [{
    decision: String,
    actionItems: [{
      description: String,
      assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      dueDate: Date,
      status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed'],
        default: 'pending'
      }
    }]
  }],
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date
  },
  attachments: [{
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
meetingSchema.index({ institution: 1, status: 1 });
meetingSchema.index({ scheduledDate: 1, status: 1 });
meetingSchema.index({ 'participants.user': 1 });

const Meeting = mongoose.model('Meeting', meetingSchema);

export {
  Announcement,
  Event,
  Report,
  Meeting
};

export default {
  Announcement,
  Event,
  Report,
  Meeting
};
