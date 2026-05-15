import mongoose from 'mongoose';

const VALID_VISIBILITY = ['private', 'shared', 'public'];
const VALID_ACCESS_LEVELS = ['view', 'download', 'edit', 'full'];

const fileSharingSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    maxlength: 255,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000,
  },
  name: {
    type: String,
    required: true,
  },
  originalName: String,
  fileType: {
    type: String,
    required: true,
  },
  mimeType: String,
  size: {
    type: Number,
    required: true,
    min: 0,
  },
  url: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    permission: {
      type: String,
      enum: ['view', 'download', 'edit'],
      default: 'view',
    },
    sharedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  chatRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupChatRoom',
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
  },
  category: {
    type: String,
    enum: ['document', 'image', 'video', 'audio', 'archive', 'other'],
    default: 'other',
  },
  tags: [String],
  visibility: {
    type: String,
    enum: VALID_VISIBILITY,
    default: 'private',
  },
  accessLevel: {
    type: String,
    enum: VALID_ACCESS_LEVELS,
    default: 'view',
  },
  downloads: {
    type: Number,
    default: 0,
  },
  views: {
    type: Number,
    default: 0,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  expiresAt: Date,
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
}, {
  timestamps: true,
});

fileSharingSchema.index({ institution: 1, category: 1 });
fileSharingSchema.index({ institution: 1, visibility: 1 });
fileSharingSchema.index({ 'sharedWith.user': 1 });
fileSharingSchema.index({ uploadedBy: 1 });
fileSharingSchema.index({ name: 1 });

const FileSharing = mongoose.model('FileSharing', fileSharingSchema);

export default FileSharing;
