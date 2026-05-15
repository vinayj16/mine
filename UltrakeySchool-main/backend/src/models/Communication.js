import mongoose from 'mongoose';

const communicationMessageSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  to: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  type: {
    type: String,
    enum: ['chat', 'email', 'calendar', 'file', 'note', 'system'],
    required: true
  },
  subject: {
    type: String,
    trim: true
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  read: {
    type: Boolean,
    default: false
  },
  delivered: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const communicationChannelSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['chat', 'email', 'calendar', 'file', 'note'],
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const userVisibilitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isInstitution: {
    type: Boolean,
    default: false
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution'
  },
  role: {
    type: String,
    required: true
  },
  isVisibleToAgents: {
    type: Boolean,
    default: true
  },
  isVisibleToSuperAdmin: {
    type: Boolean,
    default: true
  },
  visibleInstitutions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution'
  }],
  onlineStatus: {
    type: String,
    enum: ['online', 'offline', 'away', 'busy'],
    default: 'offline'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
communicationMessageSchema.index({ from: 1, createdAt: -1 });
communicationMessageSchema.index({ to: 1, createdAt: -1 });
communicationMessageSchema.index({ institutionId: 1, createdAt: -1 });
communicationMessageSchema.index({ type: 1, createdAt: -1 });

communicationChannelSchema.index({ participants: 1 });
communicationChannelSchema.index({ institutionId: 1 });
communicationChannelSchema.index({ isActive: 1, lastActivity: -1 });

userVisibilitySchema.index({ institutionId: 1 });
userVisibilitySchema.index({ onlineStatus: 1 });
userVisibilitySchema.index({ lastSeen: -1 });

export const CommunicationMessage = mongoose.model('CommunicationMessage', communicationMessageSchema);
export const CommunicationChannel = mongoose.model('CommunicationChannel', communicationChannelSchema);
export const UserVisibility = mongoose.model('UserVisibility', userVisibilitySchema);
