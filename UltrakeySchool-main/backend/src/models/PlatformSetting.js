import mongoose from 'mongoose';

const platformSettingSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['branding', 'smtp', 'sms', 'whatsapp', 'payment', 'gst', 'storage', 'notifications', 'academic', 'security', 'api', 'backup']
  },
  key: {
    type: String,
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['text', 'email', 'number', 'boolean', 'select', 'textarea', 'file', 'color', 'password', 'datetime-local']
  },
  options: [{
    type: String
  }],
  required: {
    type: Boolean,
    default: false
  },
  validation: {
    type: String
  }
}, {
  timestamps: true
});

// Create compound index for tenantId + category + key to ensure uniqueness
platformSettingSchema.index({ tenantId: 1, category: 1, key: 1 }, { unique: true });

export default mongoose.model('PlatformSetting', platformSettingSchema);
