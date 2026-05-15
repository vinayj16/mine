import mongoose from 'mongoose';

const emailSettingsSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  phpMailer: {
    enabled: {
      type: Boolean,
      default: false
    },
    host: String,
    port: Number,
    username: String,
    password: String,
    encryption: {
      type: String,
      enum: ['tls', 'ssl', 'none'],
      default: 'tls'
    },
    fromEmail: String,
    fromName: String
  },
  smtp: {
    enabled: {
      type: Boolean,
      default: false
    },
    host: String,
    port: Number,
    username: String,
    password: String,
    encryption: {
      type: String,
      enum: ['tls', 'ssl', 'none'],
      default: 'tls'
    },
    fromEmail: String,
    fromName: String
  },
  google: {
    enabled: {
      type: Boolean,
      default: false
    },
    clientId: String,
    clientSecret: String,
    refreshToken: String,
    fromEmail: String,
    fromName: String
  },
  activeProvider: {
    type: String,
    enum: ['phpMailer', 'smtp', 'google', 'none'],
    default: 'none'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

emailSettingsSchema.index({ institutionId: 1 });

export default mongoose.model('EmailSettings', emailSettingsSchema);
