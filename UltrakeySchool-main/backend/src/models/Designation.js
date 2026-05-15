import mongoose from 'mongoose';

const designationSchema = new mongoose.Schema({
  designationId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  level: { type: Number, required: true },
  department: { type: String, required: true },
  description: String,
  responsibilities: [String],
  qualifications: [String],
  salaryRange: {
    min: Number,
    max: Number,
    currency: { type: String, default: 'USD' }
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

designationSchema.index({ department: 1 });
designationSchema.index({ status: 1 });

export default mongoose.model('Designation', designationSchema);
