import mongoose from 'mongoose';

const userBlockSchema = new mongoose.Schema({
  blockerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  blockedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  blockedRole: {
    type: String,
    enum: ['student', 'teacher', 'parent', 'staff', 'admin', 'agent', 'superadmin'],
    default: null
  },
  reason: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate blocks
userBlockSchema.index({ blockerId: 1, blockedUserId: 1 }, { unique: true });

// Index for role-based blocks
userBlockSchema.index({ blockerId: 1, blockedRole: 1, isActive: 1 });

export default mongoose.model('UserBlock', userBlockSchema);
