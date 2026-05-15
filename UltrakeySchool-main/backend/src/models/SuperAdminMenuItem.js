import mongoose from 'mongoose';

const superAdminMenuItemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  to: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    required: true
  },
  badge: {
    type: mongoose.Schema.Types.Mixed
  },
  category: {
    type: String,
    enum: ['platform', 'analytics', 'security', 'system'],
    required: true,
    index: true
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  permissions: [{
    type: String
  }],
  description: {
    type: String
  },
  isCustom: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

superAdminMenuItemSchema.index({ category: 1, order: 1 });
superAdminMenuItemSchema.index({ isActive: 1, order: 1 });

const SuperAdminMenuItem = mongoose.model('SuperAdminMenuItem', superAdminMenuItemSchema);

export default SuperAdminMenuItem;
