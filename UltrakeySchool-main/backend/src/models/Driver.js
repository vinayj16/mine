import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  licenseExpiry: {
    type: Date
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  dateOfBirth: {
    type: Date
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  experience: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  avatar: {
    type: String
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  documents: [{
    type: {
      type: String,
      enum: ['License', 'ID', 'Medical', 'Other']
    },
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

driverSchema.index({ institutionId: 1, licenseNumber: 1 });
driverSchema.index({ institutionId: 1, status: 1 });

export default mongoose.model('Driver', driverSchema);
