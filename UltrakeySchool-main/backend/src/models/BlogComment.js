import mongoose from 'mongoose';

const blogCommentSchema = new mongoose.Schema({
  comment: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    default: 5
  },
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['published', 'pending'],
    default: 'pending'
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
blogCommentSchema.index({ blogId: 1, status: 1 });
blogCommentSchema.index({ userId: 1 });
blogCommentSchema.index({ schoolId: 1 });

export default mongoose.model('BlogComment', blogCommentSchema);
