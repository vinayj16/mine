import mongoose from 'mongoose';

const sportSchema = new mongoose.Schema({
  sportId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Indoor', 'Outdoor', 'Water', 'Combat', 'Team', 'Individual'],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  venue: {
    type: String,
    trim: true
  },
  schedule: {
    days: [String],
    startTime: String,
    endTime: String
  },
  maxParticipants: {
    type: Number,
    default: 0
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  equipment: [{
    name: String,
    quantity: Number,
    condition: {
      type: String,
      enum: ['Good', 'Fair', 'Poor', 'Damaged']
    }
  }],
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Seasonal'],
    default: 'Active'
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
sportSchema.index({ institution: 1, status: 1 });
sportSchema.index({ category: 1 });

export default mongoose.model('Sport', sportSchema);
