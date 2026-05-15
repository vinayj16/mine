import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  badge: {
    type: String
  },
  moduleKey: {
    type: String
  },
  permission: {
    type: String
  },
  description: {
    type: String
  },
  children: [{
    label: String,
    path: String,
    icon: String,
    moduleKey: String,
    analytics: {
      category: String,
      action: String,
      label: String
    }
  }],
  analytics: {
    category: String,
    action: String,
    label: String
  },
  order: {
    type: Number,
    default: 0
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  isCustom: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const menuSectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  icon: {
    type: String
  },
  order: {
    type: Number,
    default: 0
  },
  collapsible: {
    type: Boolean,
    default: true
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  items: [menuItemSchema]
}, { _id: false });

const menuCustomizationRoleSchema = new mongoose.Schema({
  roleId: {
    type: String,
    enum: [
      'super_admin',
      'admin',
      'teacher',
      'student',
      'parent',
      'accountant',
      'hr',
      'librarian',
      'transport_manager',
      'hostel_warden'
    ],
    required: true,
    unique: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School'
  },
  menuSections: [menuSectionSchema],
  hiddenMenuItems: [{
    type: String
  }],
  customMenuItems: [menuItemSchema],
  quickActions: [{
    id: String,
    label: String,
    icon: String,
    path: String,
    shortcut: String,
    category: {
      type: String,
      enum: ['frequent', 'recent', 'custom']
    },
    enabled: {
      type: Boolean,
      default: true
    },
    order: Number
  }],
  isDefault: {
    type: Boolean,
    default: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

menuCustomizationRoleSchema.index({ roleId: 1, schoolId: 1 });
menuCustomizationRoleSchema.index({ roleId: 1, isDefault: 1 });

export default mongoose.model('MenuCustomizationRole', menuCustomizationRoleSchema);
