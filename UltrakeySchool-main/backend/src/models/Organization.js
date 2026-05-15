import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['school', 'college', 'university', 'institute', 'training_center'],
    default: 'school'
  },
  code: {
    type: String,
    unique: true,
    required: true
  },
  description: String,
  logo: String,
  contact: {
    email: String,
    phone: String,
    website: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      pincode: String
    }
  },
  settings: {
    timezone: { type: String, default: 'UTC' },
    dateFormat: { type: String, default: 'YYYY-MM-DD' },
    currency: { type: String, default: 'INR' },
    language: { type: String, default: 'en' }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  subscription: {
    plan: { type: String, enum: ['free', 'basic', 'premium'], default: 'free' },
    startDate: Date,
    endDate: Date
  }
}, { timestamps: true });

export default mongoose.model('Organization', organizationSchema);
