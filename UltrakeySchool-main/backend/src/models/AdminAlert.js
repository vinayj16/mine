import mongoose from 'mongoose';

const adminAlertSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  institutionName: {
    type: String,
    required: true
  },
  alertType: {
    type: String,
    enum: ['EXPIRY', 'PAYMENT_OVERDUE', 'RENEWAL_REMINDER', 'SUSPENSION', 'CUSTOM'],
    required: true
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'resolved', 'dismissed'],
    default: 'pending'
  },
  expiryDate: Date,
  daysUntilExpiry: Number,
  daysOverdue: Number,
  amount: Number,
  plan: String,
  autoRenew: Boolean,
  reminderSent: Boolean,
  lastReminderDate: Date,
  reminderCount: {
    type: Number,
    default: 0
  },
  reminderFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'weekly'
  },
  nextReminderDate: Date,
  paymentMethod: String,
  renewalAmount: Number,
  lastRenewalDate: Date,
  nextRenewalDate: Date,
  notes: String,
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
adminAlertSchema.index({ institutionId: 1 });
adminAlertSchema.index({ alertType: 1 });
adminAlertSchema.index({ status: 1 });
adminAlertSchema.index({ severity: 1 });
adminAlertSchema.index({ expiryDate: 1 });
adminAlertSchema.index({ daysUntilExpiry: 1 });

export default mongoose.model('AdminAlert', adminAlertSchema);
