import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: false,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  eventType: {
    type: String,
    enum: ['academic', 'cultural', 'sports', 'celebration', 'meeting', 'workshop', 'other'],
    default: 'other'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  location: String,
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  targetAudience: [{
    type: String,
    enum: ['students', 'teachers', 'parents', 'staff', 'all']
  }],
  classIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  color: {
    type: String,
    default: '#1A6FA8'
  },
  attachments: [{
    name: String,
    url: String
  }],
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

eventSchema.index({ schoolId: 1, startDate: 1 });
eventSchema.index({ eventType: 1 });

export default mongoose.model('Event', eventSchema);
