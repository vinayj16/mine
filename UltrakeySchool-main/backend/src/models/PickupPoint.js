import mongoose from 'mongoose';

const pickupPointSchema = new mongoose.Schema({
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
  address: {
    type: String,
    required: true
  },
  location: {
    latitude: Number,
    longitude: Number
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TransportRoute'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

pickupPointSchema.index({ institutionId: 1, routeId: 1 });

export default mongoose.model('PickupPoint', pickupPointSchema);
