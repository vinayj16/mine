import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    trim: true
  },
  author: {
    type: String,
    default: 'EduSearch Team'
  },
  category: {
    type: String,
    trim: true
  },
  tags: [{
    type: String
  }],
  featuredImage: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ slug: 1 });

export default mongoose.model('blogs', blogSchema);