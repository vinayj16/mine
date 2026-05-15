import mongoose from 'mongoose';

const bannedIPSchema = new mongoose.Schema({
  ipAddress: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        // Basic IPv4 validation
        return /^(\d{1,3}\.){3}\d{1,3}$/.test(v);
      },
      message: props => `${props.value} is not a valid IP address!`
    }
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  bannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  bannedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  },
  isPermanent: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'removed'],
    default: 'active'
  },
  attempts: {
    type: Number,
    default: 0
  },
  lastAttempt: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

bannedIPSchema.index({ status: 1 });
bannedIPSchema.index({ expiresAt: 1 });

bannedIPSchema.methods.isExpired = function() {
  if (this.isPermanent) return false;
  if (!this.expiresAt) return false;
  return this.expiresAt < new Date();
};

bannedIPSchema.methods.incrementAttempts = function() {
  this.attempts += 1;
  this.lastAttempt = new Date();
  return this.save();
};

export default mongoose.model('BannedIP', bannedIPSchema);
