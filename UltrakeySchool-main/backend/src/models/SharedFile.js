import mongoose from 'mongoose';

const sharedFileSchema = new mongoose.Schema({
  fileId: {
    type: String,
    required: true,
    unique: true
  },

  fileName: {
    type: String,
    required: true,
    trim: true
  },

  originalFileName: {
    type: String,
    required: true
  },

  fileUrl: {
    type: String,
    required: true
  },

  filePath: {
    type: String,
    required: true
  },

  fileSize: {
    type: Number,
    required: true
  },

  fileType: {
    type: String,
    required: true
  },

  mimeType: {
    type: String,
    required: true
  },

  category: {
    type: String,
    enum: ['document', 'image', 'video', 'audio', 'archive', 'other'],
    default: 'document',
    index: true
  },

  description: {
    type: String,
    trim: true
  },

  tags: [{
    type: String,
    trim: true
  }],

  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
    index: true
  },

  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin', 'accountant', 'librarian', 'receptionist', 'superadmin', 'staff']
    },
    sharedAt: {
      type: Date,
      default: Date.now
    },
    permissions: {
      canView: {
        type: Boolean,
        default: true
      },
      canDownload: {
        type: Boolean,
        default: true
      },
      canShare: {
        type: Boolean,
        default: false
      },
      canEdit: {
        type: Boolean,
        default: false
      },
      canDelete: {
        type: Boolean,
        default: false
      }
    }
  }],

  isPublic: {
    type: Boolean,
    default: false
  },

  accessLevel: {
    type: String,
    enum: ['private', 'institution', 'school', 'public'],
    default: 'private',
    index: true
  },

  department: {
    type: String,
    trim: true
  },

  academicYear: {
    type: String
  },

  downloadCount: {
    type: Number,
    default: 0
  },

  viewCount: {
    type: Number,
    default: 0
  },

  expiryDate: {
    type: Date
  },

  status: {
    type: String,
    enum: ['active', 'expired', 'deleted'],
    default: 'active',
    index: true
  },

  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

sharedFileSchema.index({ institutionId: 1, category: 1, status: 1 });
sharedFileSchema.index({ uploadedBy: 1, createdAt: -1 });
sharedFileSchema.index({ accessLevel: 1, status: 1 });
sharedFileSchema.index({ fileName: 'text', description: 'text', tags: 'text' });

sharedFileSchema.pre('save', async function(next) {
  if (this.isNew && !this.fileId) {
    const count = await mongoose.model('SharedFile').countDocuments();
    this.fileId = `FILE${String(count + 1).padStart(6, '0')}`;
  }

  // Check if file is expired
  if (this.expiryDate && this.expiryDate < new Date()) {
    this.status = 'expired';
  }

  next();
});

const SharedFile = mongoose.model('SharedFile', sharedFileSchema);

export default SharedFile;
