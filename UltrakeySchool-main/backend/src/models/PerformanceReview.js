import mongoose from 'mongoose';

const performanceReviewSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  reviewPeriod: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  overallRating: { type: Number, min: 0, max: 5 },
  strengths: [String],
  improvements: [String],
  comments: String,
  status: { type: String, enum: ['draft', 'submitted', 'approved', 'rejected'], default: 'draft' },
  submittedAt: Date,
  reviewedAt: Date
}, {
  timestamps: true
});

performanceReviewSchema.index({ employee: 1, institution: 1 });
performanceReviewSchema.index({ status: 1 });

const PerformanceReview = mongoose.model('PerformanceReview', performanceReviewSchema);

export default PerformanceReview;
export { PerformanceReview };
