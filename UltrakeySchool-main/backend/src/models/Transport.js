import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  vehicleType: {
    type: String,
    required: true,
    enum: ['Bus', 'Van', 'Car', 'Auto'],
  },
  capacity: {
    type: Number,
    required: true,
  },
  manufacturer: {
    type: String,
  },
  model: {
    type: String,
  },
  year: {
    type: Number,
  },
  registrationDate: {
    type: Date,
  },
  insuranceDetails: {
    policyNumber: String,
    provider: String,
    expiryDate: Date,
    amount: Number,
  },
  fitnessDetails: {
    certificateNumber: String,
    expiryDate: Date,
  },
  pollutionDetails: {
    certificateNumber: String,
    expiryDate: Date,
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Maintenance', 'Retired'],
    default: 'Active',
  },
  gpsEnabled: {
    type: Boolean,
    default: false,
  },
  gpsDeviceId: {
    type: String,
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
}, {
  timestamps: true,
});

const routeSchema = new mongoose.Schema({
  routeName: {
    type: String,
    required: true,
    trim: true,
  },
  routeNumber: {
    type: String,
    required: true,
    trim: true,
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
  },
  stops: [{
    stopName: {
      type: String,
      required: true,
    },
    location: {
      latitude: Number,
      longitude: Number,
    },
    arrivalTime: {
      type: String,
      required: true,
    },
    departureTime: {
      type: String,
    },
    sequence: {
      type: Number,
      required: true,
    },
  }],
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  distance: {
    type: Number, // in kilometers
  },
  fare: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active',
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
}, {
  timestamps: true,
});

const studentTransportSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TransportRoute',
    required: true,
  },
  pickupStop: {
    type: String,
    required: true,
  },
  dropStop: {
    type: String,
    required: true,
  },
  fare: {
    type: Number,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active',
  },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String,
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
}, {
  timestamps: true,
});

const tripSchema = new mongoose.Schema({
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TransportRoute',
    required: true,
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  tripType: {
    type: String,
    enum: ['Pickup', 'Drop'],
    required: true,
  },
  startTime: {
    type: Date,
  },
  endTime: {
    type: Date,
  },
  startOdometer: {
    type: Number,
  },
  endOdometer: {
    type: Number,
  },
  fuelUsed: {
    type: Number,
  },
  status: {
    type: String,
    enum: ['Scheduled', 'InProgress', 'Completed', 'Cancelled'],
    default: 'Scheduled',
  },
  attendance: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    stop: String,
    boardingTime: Date,
    status: {
      type: String,
      enum: ['Boarded', 'Absent', 'Left'],
    },
  }],
  remarks: {
    type: String,
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
}, {
  timestamps: true,
});

const maintenanceSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
  },
  maintenanceType: {
    type: String,
    required: true,
    enum: ['Routine', 'Repair', 'Inspection', 'Emergency'],
  },
  description: {
    type: String,
    required: true,
  },
  scheduledDate: {
    type: Date,
    required: true,
  },
  completedDate: {
    type: Date,
  },
  cost: {
    type: Number,
  },
  serviceProvider: {
    type: String,
  },
  nextServiceDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['Scheduled', 'InProgress', 'Completed', 'Cancelled'],
    default: 'Scheduled',
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes
vehicleSchema.index({ tenant: 1, status: 1 });
routeSchema.index({ tenant: 1, status: 1 });
studentTransportSchema.index({ tenant: 1, student: 1, status: 1 });
tripSchema.index({ tenant: 1, date: 1, status: 1 });
maintenanceSchema.index({ tenant: 1, vehicle: 1, status: 1 });

export const Vehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema);
export const TransportRoute = mongoose.models.TransportRoute || mongoose.model('TransportRoute', routeSchema);
export const StudentTransport = mongoose.models.StudentTransport || mongoose.model('StudentTransport', studentTransportSchema);
export const Trip = mongoose.models.Trip || mongoose.model('Trip', tripSchema);
export const VehicleMaintenance = mongoose.models.VehicleMaintenance || mongoose.model('VehicleMaintenance', maintenanceSchema);
