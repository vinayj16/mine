import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    trim: true
  },
  institution: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    default: 5,
    min: 1,
    max: 5
  },
  status: {
    type: String,
    enum: ['approved', 'pending', 'rejected', 'active', 'inactive'],
    default: 'approved'
  },
  type: {
    type: String,
    enum: ['institution', 'parent', 'teacher', 'staff', 'student'],
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    default: ''
  },
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

testimonialSchema.index({ name: 1 });
testimonialSchema.index({ role: 1 });
testimonialSchema.index({ status: 1 });
testimonialSchema.index({ type: 1 });

const Testimonial = mongoose.model('testimonials', testimonialSchema);

export default Testimonial;