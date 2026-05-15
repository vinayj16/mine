import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  departmentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  head: String,
  description: String,
  budget: Number,
  employeeCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

departmentSchema.index({ status: 1 });

export default mongoose.model('Department', departmentSchema);
