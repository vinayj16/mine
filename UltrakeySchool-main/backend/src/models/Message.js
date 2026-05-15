import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  senderId: {
    type: String,
    required: true,
    index: true
  },
  senderName: String,
  content: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'audio', 'video'],
    default: 'text'
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }],
  readBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }],
  deliveryStatus: {
    sent: { type: Boolean, default: true },
    delivered: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    deliveredAt: Date,
    readAt: Date
  },
  recipientId: {
    type: String,
    index: true
  },
  isDeleted: { type: Boolean, default: false },
  isEdited: { type: Boolean, default: false }
}, { timestamps: true });

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
