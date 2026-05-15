import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  playerId: {
    type: String,
    required: true,
    unique: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String
  },
  sportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sport',
    required: true
  },
  sportName: {
    type: String,
    required: true
  },
  position: {
    type: String,
    trim: true
  },
  jerseyNumber: {
    type: String
  },
  joinDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'injured', 'suspended'],
    default: 'active'
  },
  achievements: [{
    title: String,
    description: String,
    date: Date
  }],
  statistics: {
    matchesPlayed: {
      type: Number,
      default: 0
    },
    wins: {
      type: Number,
      default: 0
    },
    losses: {
      type: Number,
      default: 0
    },
    draws: {
      type: Number,
      default: 0
    }
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
playerSchema.index({ institution: 1, playerId: 1 });
playerSchema.index({ studentId: 1 });
playerSchema.index({ sportId: 1 });
playerSchema.index({ status: 1 });

export default mongoose.model('Player', playerSchema);
