import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String
  },
  category: {
    type: String,
    enum: ['dashboard', 'students', 'teachers', 'staff', 'classes', 'attendance', 'fees', 'exams', 'library', 'hostel', 'transport', 'reports', 'settings', 'system'],
    required: true
  },
  module: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

permissionSchema.index({ category: 1 });
permissionSchema.index({ module: 1 });

const Permission = mongoose.model('Permission', permissionSchema);

export default Permission;
