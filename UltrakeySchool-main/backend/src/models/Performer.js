import mongoose from 'mongoose';

const performerSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['teacher', 'student'],
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    trim: true
  },
  class: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    default: '/assets/img/placeholder-avatar.webp'
  },
  achievements: [{
    type: String,
    trim: true
  }],
  performance: {
    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    attendance: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    grade: {
      type: String,
      trim: true
    }
  },
  metrics: {
    totalScore: {
      type: Number,
      default: 0
    },
    examScores: [{
      examId: mongoose.Schema.Types.ObjectId,
      score: Number,
      maxScore: Number,
      date: Date
    }],
    assignmentCompletion: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    behaviorScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    }
  },
  period: {
    month: {
      type: Number,
      min: 1,
      max: 12
    },
    year: {
      type: Number
    },
    quarter: {
      type: Number,
      min: 1,
      max: 4
    }
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  featuredOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
performerSchema.index({ schoolId: 1, type: 1, isFeatured: 1, featuredOrder: 1 });
performerSchema.index({ schoolId: 1, 'performance.rating': -1 });
performerSchema.index({ schoolId: 1, 'metrics.totalScore': -1 });

// Virtual for title
performerSchema.virtual('title').get(function() {
  return this.type === 'teacher' ? 'Best Performer' : 'Star Students';
});

// Method to calculate total score
performerSchema.methods.calculateTotalScore = function() {
  const weights = {
    rating: 0.3,
    attendance: 0.2,
    examScores: 0.3,
    assignmentCompletion: 0.1,
    behaviorScore: 0.1
  };

  let examAverage = 0;
  if (this.metrics.examScores && this.metrics.examScores.length > 0) {
    const totalPercentage = this.metrics.examScores.reduce((sum, exam) => {
      return sum + (exam.score / exam.maxScore) * 100;
    }, 0);
    examAverage = totalPercentage / this.metrics.examScores.length;
  }

  this.metrics.totalScore = 
    (this.performance.rating * 10 * weights.rating) +
    (this.performance.attendance * weights.attendance) +
    (examAverage * weights.examScores) +
    (this.metrics.assignmentCompletion * weights.assignmentCompletion) +
    (this.metrics.behaviorScore * 10 * weights.behaviorScore);

  return this.metrics.totalScore;
};

// Pre-save hook to calculate total score
performerSchema.pre('save', function(next) {
  if (this.isModified('performance') || this.isModified('metrics')) {
    this.calculateTotalScore();
  }
  next();
});

export default mongoose.model('Performer', performerSchema);
