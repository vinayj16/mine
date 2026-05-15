import mongoose from 'mongoose';

const ticketContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution'
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'parent', 'admin', 'staff', 'guest'],
    default: 'guest'
  }
}, { _id: false });

const ticketCategorySchema = new mongoose.Schema({
  primary: {
    type: String,
    required: true,
    enum: ['technical', 'billing', 'account', 'feature', 'bug', 'general']
  },
  secondary: String,
  tags: [String]
}, { _id: false });

const ticketPrioritySchema = new mongoose.Schema({
  level: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'urgent', 'critical'],
    default: 'medium'
  },
  sla: {
    responseTime: Number,
    resolutionTime: Number
  },
  autoEscalate: {
    type: Boolean,
    default: false
  },
  escalationThreshold: Number
}, { _id: false });

const ticketAssignmentSchema = new mongoose.Schema({
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: Date,
  team: String,
  department: String,
  reassignmentCount: {
    type: Number,
    default: 0
  },
  reassignmentHistory: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    timestamp: Date
  }]
}, { _id: false });

const ticketTimelineSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now
  },
  firstResponseAt: Date,
  lastResponseAt: Date,
  resolvedAt: Date,
  closedAt: Date,
  reopenedAt: Date,
  responseTime: Number,
  resolutionTime: Number,
  totalTime: Number,
  escalatedAt: Date,
  escalationHistory: [{
    level: Number,
    escalatedBy: String,
    escalatedTo: String,
    reason: String,
    timestamp: Date
  }]
}, { _id: false });

const messageSchema = new mongoose.Schema({
  id: String,
  sender: {
    name: String,
    email: String,
    role: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['message', 'note', 'system'],
    default: 'message'
  },
  visibility: {
    type: String,
    enum: ['public', 'internal'],
    default: 'public'
  },
  attachments: [{
    name: String,
    url: String,
    size: Number,
    type: String
  }],
  isRead: {
    type: Boolean,
    default: false
  }
});

const ticketCommunicationSchema = new mongoose.Schema({
  messages: [messageSchema],
  totalMessages: {
    type: Number,
    default: 0
  },
  customerMessages: {
    type: Number,
    default: 0
  },
  agentMessages: {
    type: Number,
    default: 0
  }
}, { _id: false });

const ticketSatisfactionSchema = new mongoose.Schema({
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: String,
  surveyCompletedAt: Date,
  surveySent: {
    type: Boolean,
    default: false
  },
  surveySentAt: Date,
  surveyCompleted: {
    type: Boolean,
    default: false
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpCompleted: {
    type: Boolean,
    default: false
  },
  followUpNotes: String
}, { _id: false });

const ticketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  subject: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    required: true
  },
  
  status: {
    type: String,
    required: true,
    enum: ['open', 'in-progress', 'pending', 'resolved', 'closed', 'reopened'],
    default: 'open',
    index: true
  },
  
  requester: {
    type: ticketContactSchema,
    required: true
  },
  
  category: {
    type: ticketCategorySchema,
    required: true
  },
  
  priority: {
    type: ticketPrioritySchema,
    required: true
  },
  
  assignment: ticketAssignmentSchema,
  
  timeline: {
    type: ticketTimelineSchema,
    default: () => ({})
  },
  
  communication: {
    type: ticketCommunicationSchema,
    default: () => ({})
  },
  
  satisfaction: {
    type: ticketSatisfactionSchema,
    default: () => ({})
  },
  
  attachments: [{
    name: String,
    url: String,
    size: Number,
    type: String,
    uploadedBy: String,
    uploadedAt: Date
  }],
  
  relatedTickets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupportTicket'
  }],
  
  source: {
    type: String,
    enum: ['email', 'portal', 'phone', 'chat', 'api'],
    default: 'portal'
  },
  
  metadata: {
    browser: String,
    os: String,
    device: String,
    ipAddress: String,
    userAgent: String
  },
  
  resolution: {
    summary: String,
    steps: [String],
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date
  },
  
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  createdBy: {
    type: String,
    default: 'system'
  },
  
  updatedBy: {
    type: String,
    default: 'system'
  }
}, {
  timestamps: true
});

// ticketSchema.index({ 'requester.email': 1 }); // Removed duplicate index
ticketSchema.index({ 'category.primary': 1 });
ticketSchema.index({ 'priority.level': 1 });
ticketSchema.index({ 'assignment.assignedTo': 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ 'timeline.resolvedAt': 1 });

ticketSchema.pre('save', function(next) {
  if (this.isModified('communication.messages')) {
    this.communication.totalMessages = this.communication.messages.length;
    this.communication.customerMessages = this.communication.messages.filter(
      m => m.sender.role !== 'agent' && m.sender.role !== 'admin'
    ).length;
    this.communication.agentMessages = this.communication.messages.filter(
      m => m.sender.role === 'agent' || m.sender.role === 'admin'
    ).length;
  }
  next();
});

ticketSchema.methods.addMessage = function(messageData) {
  this.communication.messages.push(messageData);
  this.communication.totalMessages = this.communication.messages.length;
  
  if (messageData.sender.role === 'agent' || messageData.sender.role === 'admin') {
    this.communication.agentMessages += 1;
    if (!this.timeline.firstResponseAt) {
      this.timeline.firstResponseAt = new Date();
      this.timeline.responseTime = this.timeline.firstResponseAt - this.timeline.createdAt;
    }
    this.timeline.lastResponseAt = new Date();
  } else {
    this.communication.customerMessages += 1;
  }
  
  return this.save();
};

ticketSchema.methods.updateStatus = function(newStatus, userId) {
  this.status = newStatus;
  this.updatedBy = userId;
  
  if (newStatus === 'resolved') {
    this.timeline.resolvedAt = new Date();
    this.timeline.resolutionTime = this.timeline.resolvedAt - this.timeline.createdAt;
  } else if (newStatus === 'closed') {
    this.timeline.closedAt = new Date();
    this.timeline.totalTime = this.timeline.closedAt - this.timeline.createdAt;
  } else if (newStatus === 'reopened') {
    this.timeline.reopenedAt = new Date();
    this.timeline.resolvedAt = null;
    this.timeline.closedAt = null;
  }
  
  return this.save();
};

ticketSchema.methods.assignTo = function(userId, assignedBy) {
  if (this.assignment.assignedTo) {
    this.assignment.reassignmentHistory.push({
      from: this.assignment.assignedTo,
      to: userId,
      timestamp: new Date()
    });
    this.assignment.reassignmentCount += 1;
  }
  
  this.assignment.assignedTo = userId;
  this.assignment.assignedBy = assignedBy;
  this.assignment.assignedAt = new Date();
  
  return this.save();
};

ticketSchema.methods.escalate = function(level, reason, escalatedBy, escalatedTo) {
  this.timeline.escalationHistory.push({
    level,
    escalatedBy,
    escalatedTo,
    reason,
    timestamp: new Date()
  });
  
  if (!this.timeline.escalatedAt) {
    this.timeline.escalatedAt = new Date();
  }
  
  return this.save();
};

const SupportTicket = mongoose.model('SupportTicket', ticketSchema);

export default SupportTicket;
