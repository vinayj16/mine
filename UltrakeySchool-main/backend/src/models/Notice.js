import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
  noticeId: {
    type: String,
    required: true,
    unique: true
  },
  
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
  
  noticeDate: {
    type: Date,
    required: true,
    index: true
  },
  
  publishDate: {
    type: Date,
    required: true,
    index: true
  },
  
  recipients: [{
    type: String,
    enum: ['student', 'parent', 'teacher', 'admin', 'accountant', 'librarian', 'receptionist', 'superadmin', 'staff'],
    lowercase: true
  }],
  
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileSize: Number,
    fileType: String,
    uploadedAt: Date
  }],
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    lowercase: true
  },
  
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    lowercase: true,
    index: true
  },
  
  academicYear: {
    type: String,
    required: true
  },
  
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
    index: true
  },
  
  views: {
    type: Number,
    default: 0
  },
  
  viewedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: Date
  }],
  
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

noticeSchema.index({ institutionId: 1, academicYear: 1, status: 1 });
noticeSchema.index({ publishDate: -1 });
noticeSchema.index({ recipients: 1, publishDate: -1 });
noticeSchema.index({ title: 'text', description: 'text' });

noticeSchema.pre('save', async function(next) {
  if (this.isNew && !this.noticeId) {
    const count = await mongoose.model('Notice').countDocuments();
    this.noticeId = `NOT${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

const Notice = mongoose.model('Notice', noticeSchema);

export default Notice;
