import mongoose from 'mongoose';

const gradeSchema = new mongoose.Schema({
  gradeId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  grade: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  
  marksFrom: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  
  marksTo: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  
  percentage: {
    type: String,
    required: true
  },
  
  points: {
    type: Number,
    required: true,
    min: 0,
    max: 10,
    default: 0
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    lowercase: true,
    index: true
  },
  
  description: {
    type: String,
    trim: true
  },
  
  academicYear: {
    type: String,
    required: true
  },
  
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
    index: true
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

gradeSchema.index({ institutionId: 1, academicYear: 1, status: 1 });
gradeSchema.index({ marksFrom: 1, marksTo: 1 });
gradeSchema.index({ points: -1 });

gradeSchema.pre('save', async function(next) {
  if (this.isNew && !this.gradeId) {
    const count = await mongoose.model('Grade').countDocuments();
    this.gradeId = `G${String(count + 180000).padStart(6, '0')}`;
  }
  
  if (this.marksFrom !== undefined && this.marksTo !== undefined) {
    this.percentage = this.marksTo === 0 
      ? `Below ${this.marksFrom}%` 
      : `${this.marksFrom}% - ${this.marksTo}%`;
  }
  
  next();
});

gradeSchema.pre('save', function(next) {
  if (this.marksFrom > this.marksTo) {
    next(new Error('Marks From cannot be greater than Marks To'));
  }
  next();
});

const Grade = mongoose.model('Grade', gradeSchema);

export default Grade;
