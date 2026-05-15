import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  tag: {
    type: String,
    enum: ['personal', 'work', 'social'],
    default: 'personal'
  },
  status: {
    type: String,
    enum: ['active', 'trash'],
    default: 'active'
  },
  important: {
    type: Boolean,
    default: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: false
  },
  userAvatar: {
    type: String
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution'
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileSize: Number,
    uploadedAt: Date
  }],
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
noteSchema.index({ userId: 1, status: 1 });
noteSchema.index({ institutionId: 1, status: 1 });
noteSchema.index({ important: 1, status: 1 });
noteSchema.index({ tag: 1, status: 1 });
noteSchema.index({ createdAt: -1 });
noteSchema.index({ title: 'text', description: 'text' });

// Update deletedAt when status changes to trash
noteSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'trash') {
    this.deletedAt = new Date();
  }
  next();
});

const Note = mongoose.model('Note', noteSchema);

export default Note;
