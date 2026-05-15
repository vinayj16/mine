import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema({
  holidayId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['national', 'religious', 'school', 'other'],
    default: 'school'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
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
holidaySchema.index({ institution: 1, date: 1 });
holidaySchema.index({ status: 1 });

export default mongoose.model('Holiday', holidaySchema);
