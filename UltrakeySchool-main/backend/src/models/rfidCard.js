// RFID Card Model
const mongoose = require('mongoose');

const rfidCardSchema = new mongoose.Schema({
  cardId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userType: {
    type: String,
    enum: ['student', 'teacher', 'staff', 'parent'],
    required: true
  },
  serialNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'lost', 'blocked'],
    default: 'active'
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date
  },
  location: {
    type: String,
    enum: ['gate', 'library', 'transport', 'classroom', 'office'],
    default: 'gate'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    deviceInfo: {
      type: String
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    }
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for performance
rfidCardSchema.index({ cardId: 1, institution: 1 });
rfidCardSchema.index({ userId: 1, institution: 1 });
rfidCardSchema.index({ serialNumber: 1, institution: 1 });
rfidCardSchema.index({ status: 1, isActive: 1 });

// Static methods
rfidCardSchema.statics.findByCardId = function(cardId, institutionId) {
  return this.findOne({ 
    cardId, 
    institution: institutionId,
    isActive: true 
  }).populate('userId', 'name email role');
};

rfidCardSchema.statics.findByUserId = function(userId, institutionId) {
  return this.find({ 
    userId, 
    institution: institutionId,
    isActive: true 
  });
};

rfidCardSchema.statics.getActiveCards = function(institutionId) {
  return this.find({ 
    institution: institutionId,
    isActive: true,
    status: 'active'
  }).populate('userId', 'name email role');
};

// Instance methods
rfidCardSchema.methods.updateLastUsed = function() {
  this.lastUsed = new Date();
  return this.save();
};

rfidCardSchema.methods.blockCard = function(reason = 'Manual block') {
  this.status = 'blocked';
  this.isActive = false;
  return this.save();
};

rfidCardSchema.methods.activateCard = function() {
  this.status = 'active';
  this.isActive = true;
  return this.save();
};

module.exports = mongoose.model('RfidCard', rfidCardSchema);
export default mongoose.model('RfidCard', rfidCardSchema);