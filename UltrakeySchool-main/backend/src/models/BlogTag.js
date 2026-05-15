import mongoose from 'mongoose';

const blogTagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School'
  }
}, {
  timestamps: true
});

// Indexes
blogTagSchema.index({ schoolId: 1 });
blogTagSchema.index({ status: 1 });

export default mongoose.model('BlogTag', blogTagSchema);
