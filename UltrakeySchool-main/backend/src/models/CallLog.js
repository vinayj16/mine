import mongoose from 'mongoose';

const callLogSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  callerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  callerName: String,
  callerRole: String,
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  receiverName: String,
  receiverRole: String,
  receiverPhone: String,
  callType: {
    type: String,
    enum: ['outgoing', 'incoming', 'missed', 'voicemail'],
    default: 'outgoing'
  },
  direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    required: true
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  status: {
    type: String,
    enum: ['completed', 'failed', 'busy', 'no_answer', 'cancelled'],
    default: 'completed'
  },
  notes: String,
  callDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

callLogSchema.index({ schoolId: 1, callDate: -1 });
callLogSchema.index({ callerId: 1 });

export default mongoose.model('CallLog', callLogSchema);
