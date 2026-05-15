import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['warning', 'critical', 'info'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  triggeredAt: {
    type: Date,
    default: Date.now
  },
  acknowledged: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const statisticSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  statId: {
    type: String,
    required: true,
    index: true
  },
  label: {
    type: String,
    required: true
  },
  value: {
    type: Number,
    required: true,
    default: 0
  },
  delta: {
    type: Number,
    default: 0
  },
  deltaType: {
    type: String,
    enum: ['increase', 'decrease', 'neutral'],
    default: 'neutral'
  },
  active: {
    type: Number,
    default: 0
  },
  inactive: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  icon: {
    type: String,
    default: '/assets/img/icons/default-stat.svg'
  },
  category: {
    type: String,
    enum: ['academic', 'staff', 'finance', 'operations'],
    required: true,
    index: true
  },
  trend: {
    type: String,
    enum: ['up', 'down', 'stable'],
    default: 'stable'
  },
  period: {
    type: String,
    default: 'this-month'
  },
  previousPeriod: {
    value: Number,
    delta: Number
  },
  thresholds: {
    warning: Number,
    critical: Number
  },
  alerts: [alertSchema],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

statisticSchema.index({ schoolId: 1, statId: 1, createdAt: -1 });
statisticSchema.index({ schoolId: 1, category: 1 });

statisticSchema.pre('save', function(next) {
  this.total = this.active + this.inactive;
  
  if (this.thresholds) {
    if (this.thresholds.critical && this.value <= this.thresholds.critical) {
      const existingCritical = this.alerts.find(a => a.type === 'critical' && !a.acknowledged);
      if (!existingCritical) {
        this.alerts.push({
          type: 'critical',
          message: `${this.label} has reached critical threshold`,
          triggeredAt: new Date(),
          acknowledged: false
        });
      }
    } else if (this.thresholds.warning && this.value <= this.thresholds.warning) {
      const existingWarning = this.alerts.find(a => a.type === 'warning' && !a.acknowledged);
      if (!existingWarning) {
        this.alerts.push({
          type: 'warning',
          message: `${this.label} is below recommended threshold`,
          triggeredAt: new Date(),
          acknowledged: false
        });
      }
    }
  }
  
  next();
});

export default mongoose.model('Statistic', statisticSchema);
