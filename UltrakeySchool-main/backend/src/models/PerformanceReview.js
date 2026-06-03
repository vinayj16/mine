import mongoose from 'mongoose';

const performanceReviewSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  reviewPeriod: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  reviewDate: { type: Date, default: Date.now },
  ratings: {
    jobKnowledge: { type: Number, min: 1, max: 5 },
    qualityOfWork: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    teamwork: { type: Number, min: 1, max: 5 },
    punctuality: { type: Number, min: 1, max: 5 },
    initiative: { type: Number, min: 1, max: 5 },
    leadership: { type: Number, min: 1, max: 5 },
    problemSolving: { type: Number, min: 1, max: 5 }
  },
  comments: {
    strengths: { type: String },
    areasForImprovement: { type: String },
    goals: { type: String },
    overallComments: { type: String }
  },
  overallRating: { type: Number, min: 1, max: 5 },
  status: {
    type: String,
    enum: ['draft', 'pending', 'completed', 'approved'],
    default: 'draft'
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  }
}, {
  timestamps: true
});

performanceReviewSchema.index({ employeeId: 1, reviewPeriod: 1 });
performanceReviewSchema.index({ institution: 1 });

const PerformanceReview = mongoose.model('PerformanceReview', performanceReviewSchema);
export default PerformanceReview;