import mongoose from 'mongoose';

const VALID_CHANNELS = ['email', 'sms', 'whatsapp', 'push', 'all'];
const VALID_STATUSES = ['pending', 'sent', 'failed', 'scheduled', 'cancelled'];
const VALID_REMINDER_TYPES = ['overdue', 'upcoming', 'final', 'courtesy', 'custom'];

const feeReminderSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    feeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fee' },
    reminderType: { type: String, enum: VALID_REMINDER_TYPES, default: 'upcoming' },
    channel: { type: String, enum: VALID_CHANNELS },
    channels: [{ type: String, enum: VALID_CHANNELS }],
    message: { type: String },
    status: { type: String, enum: VALID_STATUSES, default: 'pending' },
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    cancelledAt: { type: Date },
    dueDate: { type: Date },
    amount: { type: Number },
    currency: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    errorMessage: { type: String }
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.FeeReminder || mongoose.model('FeeReminder', feeReminderSchema);
