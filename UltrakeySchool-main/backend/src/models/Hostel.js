import mongoose from 'mongoose';

// Room Schema
const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true
  },
  hostel: {
    type: String,
    required: true,
    enum: ['boys', 'girls', 'mixed']
  },
  floor: {
    type: Number,
    required: true,
    min: 0
  },
  block: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['single', 'double', 'triple', 'dormitory'],
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  occupied: {
    type: Number,
    default: 0,
    min: 0
  },
  facilities: [{
    type: String,
    enum: ['attached-bathroom', 'balcony', 'ac', 'fan', 'study-table', 'wardrobe', 'wifi', 'laundry']
  }],
  rent: {
    type: Number,
    required: true,
    min: 0
  },
  securityDeposit: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance', 'reserved'],
    default: 'available'
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  description: {
    type: String,
    trim: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
roomSchema.index({ institution: 1, hostel: 1, status: 1 });
roomSchema.index({ block: 1, floor: 1 });

const Room = mongoose.model('Room', roomSchema);

// Hostel Schema
const hostelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['boys', 'girls', 'mixed', 'staff'],
      required: true
    },
    campus: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

hostelSchema.index({ institution: 1, code: 1 }, { unique: true });

const Hostel = mongoose.model('Hostel', hostelSchema);

// Allocation Schema
const allocationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  allocationDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expectedCheckoutDate: {
    type: Date
  },
  actualCheckoutDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'checked-out', 'transferred'],
    default: 'active'
  },
  rentPaid: {
    type: Boolean,
    default: false
  },
  securityDepositPaid: {
    type: Boolean,
    default: false
  },
  securityDepositReturned: {
    type: Boolean,
    default: false
  },
  securityDepositAmount: {
    type: Number,
    min: 0
  },
  keyCardNumber: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  allocatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
allocationSchema.index({ student: 1, status: 1 });
allocationSchema.index({ room: 1, status: 1 });
allocationSchema.index({ institution: 1, status: 1 });
allocationSchema.index({ allocationDate: -1 });

const Allocation = mongoose.model('Allocation', allocationSchema);

// Complaint Schema
const complaintSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['maintenance', 'cleanliness', 'noise', 'facilities', 'security', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'closed'],
    default: 'pending'
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedDate: {
    type: Date
  },
  resolution: {
    type: String,
    trim: true
  },
  attachments: [{
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
complaintSchema.index({ institution: 1, status: 1 });
complaintSchema.index({ reportedBy: 1, status: 1 });
complaintSchema.index({ category: 1, status: 1 });
complaintSchema.index({ priority: 1, status: 1 });

const HostelComplaint = mongoose.model('HostelComplaint', complaintSchema);

// Hostel Maintenance Schema
const hostelMaintenanceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['electrical', 'plumbing', 'carpentry', 'painting', 'cleaning', 'security', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  hostel: {
    type: String,
    enum: ['boys', 'girls', 'mixed']
  },
  block: {
    type: String,
    trim: true
  },
  floor: {
    type: Number,
    min: 0
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  completedDate: {
    type: Date
  },
  estimatedCost: {
    type: Number,
    min: 0
  },
  actualCost: {
    type: Number,
    min: 0
  },
  assignedTo: {
    name: String,
    contact: String,
    company: String
  },
  materials: [{
    name: String,
    quantity: Number,
    cost: Number
  }],
  notes: {
    type: String,
    trim: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
hostelMaintenanceSchema.index({ institution: 1, status: 1 });
hostelMaintenanceSchema.index({ room: 1, status: 1 });
hostelMaintenanceSchema.index({ scheduledDate: 1, status: 1 });
hostelMaintenanceSchema.index({ category: 1, status: 1 });

const HostelMaintenance = mongoose.model('HostelMaintenance', hostelMaintenanceSchema);

// Visitor Log Schema
const visitorLogSchema = new mongoose.Schema({
  visitor: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    relation: {
      type: String,
      trim: true
    },
    idProof: {
      type: String,
      trim: true
    }
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  checkInTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  checkOutTime: {
    type: Date
  },
  purpose: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['checked-in', 'checked-out'],
    default: 'checked-in'
  },
  securityNotes: {
    type: String,
    trim: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  loggedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
visitorLogSchema.index({ student: 1, checkInTime: -1 });
visitorLogSchema.index({ institution: 1, checkInTime: -1 });
visitorLogSchema.index({ status: 1, checkInTime: -1 });

const VisitorLog = mongoose.model('VisitorLog', visitorLogSchema);

// Room Inventory Schema
const roomInventorySchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  item: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 1
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'missing'],
    default: 'good'
  },
  lastChecked: {
    type: Date,
    default: Date.now
  },
  checkedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
roomInventorySchema.index({ room: 1, item: 1 });
roomInventorySchema.index({ institution: 1, lastChecked: -1 });

const RoomInventory = mongoose.model('RoomInventory', roomInventorySchema);

// Room Type Schema
const roomTypeSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
roomTypeSchema.index({ institution: 1, type: 1 });

const RoomType = mongoose.model('RoomType', roomTypeSchema);

export {
  Room,
  Hostel,
  Allocation,
  HostelComplaint,
  HostelMaintenance,
  VisitorLog,
  RoomInventory,
  RoomType
};

export default {
  Room,
  Hostel,
  Allocation,
  HostelComplaint,
  HostelMaintenance,
  VisitorLog,
  RoomInventory,
  RoomType
};
