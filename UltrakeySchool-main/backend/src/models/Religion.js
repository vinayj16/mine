import mongoose from 'mongoose';

const religionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  
  description: {
    type: String,
    trim: true
  },
  
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution'
  },
  
  code: {
    type: String,
    trim: true,
    uppercase: true
  },
  
  displayOrder: {
    type: Number,
    default: 0
  },
  
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

religionSchema.index({ name: 1, institutionId: 1 }, { unique: true });
religionSchema.index({ status: 1, isDeleted: 1 });

const Religion = mongoose.model('Religion', religionSchema);

export default Religion;
