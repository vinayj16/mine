import mongoose from 'mongoose';

const recruitmentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  department: { type: String, enum: ['administration', 'teaching', 'support', 'maintenance', 'transport', 'security', 'other'], required: true },
  designation: { type: String, required: true, trim: true },
  employmentType: { type: String, enum: ['full-time', 'part-time', 'contract', 'temporary'], default: 'full-time' },
  salary: { type: Number, required: true, min: 0 },
  description: { type: String, required: true },
  requirements: [String],
  responsibilities: [String],
  benefits: [String],
  location: { type: String, trim: true },
  status: { type: String, enum: ['draft', 'published', 'closed', 'cancelled'], default: 'draft' },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  publishedDate: Date,
  closingDate: Date,
  applicants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    appliedDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['applied', 'shortlisted', 'interviewed', 'selected', 'rejected'], default: 'applied' },
    resume: String,
    coverLetter: String,
    notes: String
  }]
}, {
  timestamps: true
});

recruitmentSchema.index({ institution: 1, status: 1 });
recruitmentSchema.index({ department: 1 });
recruitmentSchema.index({ postedBy: 1 });

const Recruitment = mongoose.model('Recruitment', recruitmentSchema);

export default Recruitment;
export { Recruitment };
