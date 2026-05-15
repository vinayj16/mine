import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: false, // Make optional for global notifications
    index: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'error', 'success', 'new_message', 'message_read', 'user_online', 'user_offline', 'group_invite'],
    default: 'info',
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  actionUrl: {
    type: String
  },
  actionText: {
    type: String
  },
  sender: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    avatar: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Chat-specific fields
  conversationId: String,
  messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  institutionCode: String,
  expiresAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

notificationSchema.index({ schoolId: 1, recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Notification', notificationSchema);
