import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  institutionCode: {
    type: String,
    required: function() {
      // institutionCode is required unless it's a global conversation
      return !this.isGlobal;
    },
    index: true
  },
  isGlobal: {
    type: Boolean,
    default: false,
    index: true
  },
  participants: [{
    userId: { type: String, required: true },
    role: String,
    name: String,
    email: String,
    institutionCode: String,
    joinedAt: { type: Date, default: Date.now }
  }],
  title: String,
  isGroup: { type: Boolean, default: false },
  groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastMessage: {
    message: String,
    senderId: { type: String },
    senderName: String,
    messageType: { type: String, enum: ['text', 'image', 'file', 'audio', 'video'], default: 'text' },
    sentAt: { type: Date, default: Date.now },
    deliveredAt: Date,
    readAt: Date
  },
  unreadCount: { type: Map, of: Number, default: {} },
  messageDeliveryStatus: { 
    type: Map, 
    of: { 
      delivered: Boolean, 
      read: Boolean, 
      deliveredAt: Date, 
      readAt: Date 
    }, 
    default: {} 
  },
  isActive: { type: Boolean, default: true },
  // For grouping conversations by category (children, parents, teachers, etc.)
  category: {
    type: String,
    enum: ['general', 'children', 'parents', 'teachers', 'staff', 'management', 'custom'],
    default: 'general'
  },
  // List of user IDs who are blocked from this conversation
  blockedUsers: [{ type: String }]
}, { timestamps: true });

conversationSchema.index({ institutionCode: 1, participants: 1 });
conversationSchema.index({ isGlobal: 1, participants: 1 });
conversationSchema.index({ updatedAt: -1 });

export default mongoose.model('Conversation', conversationSchema);
