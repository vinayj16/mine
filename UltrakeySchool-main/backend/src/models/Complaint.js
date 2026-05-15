import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  complaintId: {
    type: String,
    required: true,
    unique: true,
    default: () => `CMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Academic', 'Infrastructure', 'Staff', 'Administration', 'Transport', 'Hostel', 'Library', 'Canteen', 'Other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['open', 'pending', 'in-progress', 'resolved', 'closed'],
    default: 'open'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  attachments: [{
    filename: String,
    url: String,
    type: String
  }],
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolutionNotes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
complaintSchema.index({ schoolId: 1, createdAt: -1 });
complaintSchema.index({ status: 1, priority: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ reportedBy: 1 });

// Virtual for complaint age
complaintSchema.virtual('age').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return days;
});

// Virtual for days since last update
complaintSchema.virtual('daysSinceUpdate').get(function() {
  const now = new Date();
  const lastUpdate = this.updatedAt || this.createdAt;
  const diff = now - lastUpdate;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// Static method to get complaints by status
complaintSchema.statics.getByStatus = function(status, schoolId) {
  return this.find({ status, schoolId }).populate('reportedBy assignedTo', 'name email');
};

// Static method to get complaints by category
complaintSchema.statics.getByCategory = function(category, schoolId) {
  return this.find({ category, schoolId }).populate('reportedBy', 'name email');
};

// Static method to get high priority complaints
complaintSchema.statics.getHighPriority = function(schoolId) {
  return this.find({ 
    priority: { $in: ['High', 'Critical'] },
    status: { $ne: 'resolved' },
    schoolId 
  }).populate('reportedBy', 'name email');
};

// Instance method to add comment
complaintSchema.methods.addComment = function(userId, comment) {
  this.comments.push({
    userId,
    comment,
    createdAt: new Date()
  });
  return this.save();
};

// Instance method to update status
complaintSchema.methods.updateStatus = function(status, updatedBy) {
  this.status = status;
  this.updatedAt = new Date();
  if (status === 'resolved') {
    this.resolvedAt = new Date();
    this.resolvedBy = updatedBy;
  }
  return this.save();
};

// Instance method to assign to user
complaintSchema.methods.assignTo = function(userId) {
  this.assignedTo = userId;
  this.status = 'in-progress';
  this.updatedAt = new Date();
  return this.save();
};

const modelName = 'Complaint';
const ComplaintModel = mongoose.models[modelName] || mongoose.model(modelName, complaintSchema);
export default ComplaintModel;
