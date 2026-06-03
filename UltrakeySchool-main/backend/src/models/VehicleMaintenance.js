import mongoose from 'mongoose';

const vehicleMaintenanceSchema = new mongoose.Schema({
  maintenanceId: {
    type: String,
    required: true,
    unique: true
  },

  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    index: true
  },

  vehicleNumber: {
    type: String,
    required: true
  },

  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
    index: true
  },

  maintenanceType: {
    type: String,
    enum: ['routine', 'repair', 'inspection', 'emergency', 'upgrade'],
    required: true,
    index: true
  },

  description: {
    type: String,
    required: true,
    trim: true
  },

  scheduledDate: {
    type: Date,
    required: true
  },

  completedDate: {
    type: Date
  },

  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'pending'],
    default: 'scheduled',
    index: true
  },

  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  cost: {
    type: Number,
    default: 0
  },

  performedBy: {
    type: String,
    trim: true
  },

  serviceProvider: {
    name: String,
    contact: String,
    address: String
  },

  partsReplaced: [{
    partName: String,
    partNumber: String,
    quantity: Number,
    cost: Number
  }],

  odometerReading: {
    type: Number
  },

  nextMaintenanceDate: {
    type: Date
  },

  documents: [{
    fileName: String,
    fileUrl: String,
    uploadedAt: Date
  }],

  notes: {
    type: String,
    trim: true
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  approvalDate: {
    type: Date
  },

  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

vehicleMaintenanceSchema.index({ institutionId: 1, vehicleId: 1, status: 1 });
vehicleMaintenanceSchema.index({ scheduledDate: 1 });
vehicleMaintenanceSchema.index({ status: 1, priority: 1 });
vehicleMaintenanceSchema.index({ vehicleNumber: 'text', description: 'text' });

vehicleMaintenanceSchema.pre('save', async function(next) {
  if (this.isNew && !this.maintenanceId) {
    const count = await mongoose.model('VehicleMaintenance').countDocuments();
    this.maintenanceId = `VM${String(count + 1).padStart(6, '0')}`;
  }

  // Auto-update status based on dates
  if (this.completedDate && this.status === 'scheduled') {
    this.status = 'completed';
  }

  next();
});

const VehicleMaintenance = mongoose.models.VehicleMaintenance || mongoose.model('VehicleMaintenance', vehicleMaintenanceSchema);

export default VehicleMaintenance;
