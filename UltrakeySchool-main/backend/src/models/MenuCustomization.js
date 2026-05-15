import mongoose from 'mongoose';

const menuCustomizationSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'teacher', 'student', 'parent', 'guardian', 'staff'],
    required: true,
    index: true
  },
  menuItems: [{
    id: String,
    label: String,
    icon: String,
    to: String,
    header: Boolean,
    badge: String,
    order: Number,
    visible: {
      type: Boolean,
      default: true
    },
    children: [{
      id: String,
      label: String,
      icon: String,
      to: String,
      order: Number,
      visible: {
        type: Boolean,
        default: true
      },
      children: [{
        id: String,
        label: String,
        to: String,
        order: Number,
        visible: {
          type: Boolean,
          default: true
        }
      }]
    }]
  }],
  customMenuItems: [{
    id: String,
    label: String,
    icon: String,
    to: String,
    order: Number,
    section: String,
    permissions: [String],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  hiddenSections: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

menuCustomizationSchema.index({ schoolId: 1, role: 1 }, { unique: true });

menuCustomizationSchema.methods.addCustomMenuItem = function(menuItem, userId) {
  this.customMenuItems.push({
    ...menuItem,
    id: menuItem.id || `custom-${Date.now()}`,
    createdBy: userId,
    createdAt: new Date()
  });
  return this.save();
};

menuCustomizationSchema.methods.removeCustomMenuItem = function(menuItemId) {
  this.customMenuItems = this.customMenuItems.filter(item => item.id !== menuItemId);
  return this.save();
};

menuCustomizationSchema.methods.updateMenuItemVisibility = function(menuItemId, visible) {
  const findAndUpdate = (items) => {
    for (let item of items) {
      if (item.id === menuItemId) {
        item.visible = visible;
        return true;
      }
      if (item.children && item.children.length > 0) {
        if (findAndUpdate(item.children)) return true;
      }
    }
    return false;
  };
  
  findAndUpdate(this.menuItems);
  return this.save();
};

const MenuCustomization = mongoose.model('MenuCustomization', menuCustomizationSchema);

export default MenuCustomization;
