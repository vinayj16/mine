import mongoose from 'mongoose';

const emailSchema = new mongoose.Schema({
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailThread'
  },
  sender: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    avatar: String
  },
  recipients: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['to', 'cc', 'bcc'],
      required: true
    }
  }],
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [500, 'Subject cannot exceed 500 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  htmlContent: String,
  preview: String,
  isRead: {
    type: Boolean,
    default: false
  },
  isStarred: {
    type: Boolean,
    default: false
  },
  isImportant: {
    type: Boolean,
    default: false
  },
  hasAttachment: {
    type: Boolean,
    default: false
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileSize: Number,
    fileType: String,
    thumbnail: String,
    inline: Boolean,
    uploadedAt: Date
  }],
  folder: {
    type: String,
    enum: ['inbox', 'sent', 'drafts', 'archive', 'trash', 'spam', 'important'],
    default: 'inbox'
  },
  tags: [{
    type: String,
    trim: true
  }],
  labels: [{
    type: String,
    trim: true
  }],
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  size: {
    type: Number,
    default: 0
  },
  isEncrypted: {
    type: Boolean,
    default: false
  },
  isSigned: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'failed', 'draft'],
    default: 'draft'
  },
  scheduledFor: Date,
  repliedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Email'
  },
  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Email'
  },
  category: {
    type: String,
    enum: ['primary', 'social', 'promotions', 'updates', 'forums'],
    default: 'primary'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution'
  },
  readAt: Date,
  deletedAt: Date
}, {
  timestamps: true
});

// Indexes
emailSchema.index({ userId: 1, folder: 1 });
emailSchema.index({ institutionId: 1, folder: 1 });
// emailSchema.index({ 'sender.email': 1 }); // Removed duplicate index
emailSchema.index({ 'recipients.email': 1 });
emailSchema.index({ isRead: 1, folder: 1 });
emailSchema.index({ isStarred: 1 });
emailSchema.index({ isImportant: 1 });
emailSchema.index({ priority: 1 });
emailSchema.index({ createdAt: -1 });
emailSchema.index({ subject: 'text', content: 'text' });
emailSchema.index({ threadId: 1 });

// Generate preview before saving
emailSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.preview) {
    this.preview = this.content.substring(0, 150).replace(/\n/g, ' ') + '...';
  }
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  if (this.isModified('folder') && this.folder === 'trash' && !this.deletedAt) {
    this.deletedAt = new Date();
  }
  next();
});

const Email = mongoose.model('Email', emailSchema);

export default Email;
