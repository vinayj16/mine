import mongoose from 'mongoose';

const classRoomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  
  roomNo: {
    type: String,
    required: true,
    trim: true
  },
  
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  
  academicYear: {
    type: String,
    required: true
  },
  
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  
  building: {
    type: String,
    trim: true
  },
  
  floor: {
    type: Number
  },
  
  roomType: {
    type: String,
    enum: ['classroom', 'laboratory', 'library', 'auditorium', 'computer-lab', 'other'],
    default: 'classroom'
  },
  
  facilities: [{
    type: String,
    enum: ['projector', 'whiteboard', 'smartboard', 'ac', 'computers', 'wifi', 'audio-system']
  }],
  
  currentOccupancy: {
    type: Number,
    default: 0,
    min: 0
  },
  
  assignedClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },
  
  description: {
    type: String,
    trim: true
  },
  
  maintenanceSchedule: [{
    date: Date,
    type: String,
    notes: String,
    completedAt: Date
  }],
  
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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

classRoomSchema.index({ roomNo: 1, institutionId: 1, academicYear: 1 }, { unique: true });
classRoomSchema.index({ institutionId: 1, status: 1 });
classRoomSchema.index({ building: 1, floor: 1 });

classRoomSchema.pre('save', async function(next) {
  if (this.isNew && !this.roomId) {
    const count = await mongoose.model('ClassRoom').countDocuments();
    this.roomId = `R${String(count + 167648).padStart(6, '0')}`;
  }
  next();
});

classRoomSchema.methods.isAvailable = function() {
  return this.status === 'active' && this.currentOccupancy < this.capacity;
};

classRoomSchema.methods.getAvailableCapacity = function() {
  return this.capacity - this.currentOccupancy;
};

const ClassRoom = mongoose.model('ClassRoom', classRoomSchema);

export default ClassRoom;
