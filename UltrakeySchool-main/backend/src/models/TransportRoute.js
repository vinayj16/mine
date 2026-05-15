import mongoose from 'mongoose';

const transportRouteSchema = new mongoose.Schema({
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
  startPoint: {
    type: String,
    required: true
  },
  endPoint: {
    type: String,
    required: true
  },
  distance: {
    type: Number
  },
  estimatedTime: {
    type: Number
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

transportRouteSchema.index({ institutionId: 1, name: 1 });

const TransportRoute = mongoose.models.TransportRoute || mongoose.model('TransportRoute', transportRouteSchema);

export default TransportRoute;
