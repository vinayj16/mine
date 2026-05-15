import mongoose from 'mongoose';

const fileManagerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [255, 'Name cannot exceed 255 characters']
  },
  type: {
    type: String,
    enum: ['file', 'folder'],
    required: true
  },
  fileType: {
    type: String,
    enum: ['pdf', 'doc', 'xls', 'img', 'video', 'audio', 'other'],
    required: false,
    default: 'other'
  },
  icon: {
    type: String
  },
  size: {
    type: Number,
    default: 0
  },
  fileCount: {
    type: Number,
    default: 0
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FileManager',
    default: null
  },
  ownerId: {
    type: String,
    ref: 'User',
    required: true
  },
  ownerName: {
    type: String,
    required: false,
    default: 'Unknown User'
  },
  ownerImg: {
    type: String
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution'
  },
  tags: [{
    type: String,
    trim: true
  }],
  isFavorite: {
    type: Boolean,
    default: false
  },
  isShared: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  permissions: {
    type: String,
    enum: ['read', 'write', 'admin'],
    default: 'write'
  },
  downloadUrl: {
    type: String
  },
  thumbnail: {
    type: String
  },
  metadata: {
    dimensions: {
      width: Number,
      height: Number
    },
    duration: Number,
    pages: Number,
    description: String
  },
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    img: String,
    role: {
      type: String,
      enum: ['Editor', 'Viewer', 'Admin'],
      default: 'Viewer'
    }
  }],
  color: {
    type: String
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['active', 'trash'],
    default: 'active'
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
fileManagerSchema.index({ ownerId: 1, status: 1 });
fileManagerSchema.index({ institutionId: 1, status: 1 });
fileManagerSchema.index({ parentId: 1, status: 1 });
fileManagerSchema.index({ type: 1, status: 1 });
fileManagerSchema.index({ isFavorite: 1, status: 1 });
fileManagerSchema.index({ isShared: 1, status: 1 });
fileManagerSchema.index({ createdAt: -1 });
fileManagerSchema.index({ name: 'text', description: 'text' });

// Update deletedAt when status changes to trash
fileManagerSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'trash') {
    this.deletedAt = new Date();
  }
  next();
});

const FileManager = mongoose.model('FileManager', fileManagerSchema);

export default FileManager;
