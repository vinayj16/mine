import mongoose from 'mongoose';

const transportAssignmentSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TransportRoute',
    required: true
  },
  pickupPointId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PickupPoint',
    required: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  assignedDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

transportAssignmentSchema.index({ institutionId: 1, routeId: 1, vehicleId: 1 });

export default mongoose.model('TransportAssignment', transportAssignmentSchema);
