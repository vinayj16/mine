import mongoose from 'mongoose';

const todoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['new', 'pending', 'inprogress', 'done', 'trash', 'in_progress', 'completed', 'cancelled'],
    default: 'new'
  },
  completed: {
    type: Boolean,
    default: false
  },
  important: {
    type: Boolean,
    default: false
  },
  dueDate: {
    type: Date
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userAvatar: {
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
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileSize: Number,
    uploadedAt: Date
  }],
  completedAt: {
    type: Date
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
// todoSchema.index({ userId: 1, status: 1 }); // Removed duplicate index
todoSchema.index({ institutionId: 1, status: 1 });
todoSchema.index({ important: 1, status: 1 });
todoSchema.index({ dueDate: 1 });
todoSchema.index({ createdAt: -1 });

// Update completedAt when status changes to done
todoSchema.pre('save', function(next) {
  if (this.isModified('status') || this.isModified('completed')) {
    if (this.status === 'done' || this.completed) {
      this.completedAt = new Date();
      this.completed = true;
      this.status = 'done';
    }
  }
  if (this.isModified('status') && this.status === 'trash') {
    this.deletedAt = new Date();
  }
  next();
});

const Todo = mongoose.model('Todo', todoSchema);

export default Todo;
